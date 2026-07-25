import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vm from 'node:vm';

import { transpileEmittedJs } from './transpile';

/**
 * Smoke tests for the module interoperability shape of the published v8 artifacts.
 *
 * TypeScript 6 defaults `esModuleInterop` to `true` (and deprecates turning it off), so the
 * CommonJS/AMD emit of v8 packages - which never set the option - now wraps namespace/default
 * imports. `lib-commonjs` gets `tslib.__importStar` from `tsc`, `lib-amd` gets
 * `_interop_require_wildcard` from the SWC module transform.
 *
 * @see ../../../../docs/architecture/v8-published-artifacts.md
 */
describe(`esModuleInterop`, () => {
  const tmpRoot = path.join(__dirname, '../../tmp');
  let root: string;

  /**
   * mimics `tsc` ESM emit of
   * ```ts
   * import * as dep from 'dep';
   * import defaultDep from 'dep';
   * export function getNamespace() { return dep; }
   * export function getDefault() { return defaultDep; }
   * ```
   */
  const esmOutput = [
    `import * as dep from 'dep';`,
    `import defaultDep from 'dep';`,
    `export function getNamespace() { return dep; }`,
    `export function getDefault() { return defaultDep; }`,
  ].join('\n');

  beforeEach(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    root = fs.mkdtempSync(path.join(tmpRoot, 'interop-'));
    fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
    fs.writeFileSync(path.join(root, 'lib/index.js'), esmOutput, 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  /**
   * Minimal AMD loader - `define(deps, factory)` with `require`/`exports` injection, which is all
   * the emitted modules use.
   */
  function loadAmd(code: string, modules: Record<string, unknown>) {
    const exports: Record<string, unknown> = {};
    const requireFn = (id: string) => {
      if (!(id in modules)) {
        throw new Error(`AMD module "${id}" is not provided`);
      }
      return modules[id];
    };
    const define = (dependencies: string[], factory: (...args: unknown[]) => void) => {
      factory(
        ...dependencies.map(dependency => {
          if (dependency === 'require') {
            return requireFn;
          }
          if (dependency === 'exports') {
            return exports;
          }
          return requireFn(dependency);
        }),
      );
    };

    vm.runInNewContext(code, { define, console });

    return exports;
  }

  function resolveSwcHelper(specifier: string) {
    // `@swc/helpers/_/_interop_require_wildcard` -> the CommonJS build shipped by the package
    const helperName = specifier.split('/').pop();

    return require(require.resolve(`@swc/helpers/cjs/${helperName}.cjs`));
  }

  it(`should wrap namespace and default imports of the AMD output`, async () => {
    await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib-amd', module: 'amd', target: 'es5' });

    const code = fs.readFileSync(path.join(root, 'lib-amd/index.js'), 'utf-8');

    expect(code).toMatch(/^define\(\[/);
    // both imports of the same module share one interop namespace, the default is read off it
    expect(code).toContain('"@swc/helpers/_/_interop_require_wildcard"');

    // a CommonJS style dependency, ie one without `__esModule`
    const dep = { a: 'named export' };
    const dependencies: Record<string, unknown> = { dep };

    dependencies['@swc/helpers/_/_interop_require_wildcard'] = resolveSwcHelper('_interop_require_wildcard');

    const module = loadAmd(code, dependencies) as {
      getNamespace: () => Record<string, unknown>;
      getDefault: () => unknown;
    };

    const namespace = module.getNamespace();

    // interop namespace: own properties are re-exposed, the module itself becomes `default`
    expect(namespace.a).toEqual('named export');
    expect(namespace.default).toBe(dep);
    expect(module.getDefault()).toBe(dep);
    // ...it is a copy, not the module object itself
    expect(namespace).not.toBe(dep);
    // ...and it is stable - every access returns the very same namespace object
    expect(module.getNamespace()).toBe(namespace);
  });

  it(`should pass ESM dependencies through untouched`, async () => {
    await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib-amd', module: 'amd', target: 'es5' });

    const code = fs.readFileSync(path.join(root, 'lib-amd/index.js'), 'utf-8');
    const dep = { __esModule: true, a: 'named export', default: 'the default' };
    const dependencies: Record<string, unknown> = {
      dep,
      '@swc/helpers/_/_interop_require_wildcard': resolveSwcHelper('_interop_require_wildcard'),
    };

    const module = loadAmd(code, dependencies) as {
      getNamespace: () => Record<string, unknown>;
      getDefault: () => unknown;
    };

    // real ES modules are not wrapped, so module identity is preserved
    expect(module.getNamespace()).toBe(dep);
    expect(module.getDefault()).toEqual('the default');
  });

  it(`should not introduce interop into the ESM output`, async () => {
    await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib', module: 'es6', target: 'es5' });

    const code = fs.readFileSync(path.join(root, 'lib/index.js'), 'utf-8');

    expect(code).toContain(`import * as dep from 'dep'`);
    expect(code).not.toContain('_interop_require');
  });
});
