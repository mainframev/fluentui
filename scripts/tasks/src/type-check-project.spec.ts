import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { main, typeCheckProject } from './type-check-project';

/**
 * Behavioural regression test for the `--baseUrl .` replacement.
 *
 * Apps used to type check with `tsc -p . --noEmit --baseUrl .`, which made the workspace root
 * relative `paths` of `tsconfig.base.*.json` unresolvable on purpose - so a dependency resolved to
 * its published/built declarations instead of its sources. TypeScript 6 removed `baseUrl`.
 */
describe(`typeCheckProject`, () => {
  const tmpRoot = path.join(__dirname, '../tmp');
  let root: string;
  let appRoot: string;

  function createFile(filePath: string, content: string) {
    fs.mkdirSync(path.dirname(path.join(root, filePath)), { recursive: true });
    fs.writeFileSync(path.join(root, filePath), content, 'utf-8');
  }

  beforeEach(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    root = fs.mkdtempSync(path.join(tmpRoot, 'type-check-project-'));
    appRoot = path.join(root, 'app');

    createFile(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          module: 'esnext',
          moduleResolution: 'bundler',
          skipLibCheck: true,
          types: [],
          noEmit: true,
          paths: { '@proj/dep': ['./packages/dep/src/index.ts'] },
        },
      }),
    );
    createFile('packages/dep/src/index.ts', `export const dep = 'from source';`);
    createFile('app/tsconfig.json', JSON.stringify({ extends: '../tsconfig.base.json', include: ['src'] }));
    createFile('app/src/index.ts', [`import { dep } from '@proj/dep';`, `export const value = dep;`].join('\n'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function runPlainTsc() {
    return spawnSync(process.execPath, [require.resolve('typescript/lib/tsc.js'), '-p', '.', '--noEmit'], {
      cwd: appRoot,
      encoding: 'utf-8',
    });
  }

  function listGeneratedTsConfigs() {
    return fs.readdirSync(appRoot).filter(fileName => fileName.startsWith('tsconfig.__generated'));
  }

  it(`should type check against workspace sources when path aliases are on (control)`, () => {
    const actual = runPlainTsc();

    expect(actual.stdout).toEqual('');
    expect(actual.status).toEqual(0);
  });

  it(`should turn path aliases off, so imports resolve to built declarations instead of sources`, () => {
    const exitCode = typeCheckProject({ cwd: appRoot });

    expect(exitCode).not.toEqual(0);
    expect(listGeneratedTsConfigs()).toEqual([]);
  });

  it(`should pass once the dependency is resolvable without path aliases`, () => {
    fs.mkdirSync(path.join(appRoot, 'node_modules/@proj/dep'), { recursive: true });
    fs.writeFileSync(
      path.join(appRoot, 'node_modules/@proj/dep/package.json'),
      JSON.stringify({ name: '@proj/dep', version: '1.0.0', types: './index.d.ts', main: './index.js' }),
      'utf-8',
    );
    fs.writeFileSync(
      path.join(appRoot, 'node_modules/@proj/dep/index.d.ts'),
      `export declare const dep: string;`,
      'utf-8',
    );

    expect(typeCheckProject({ cwd: appRoot })).toEqual(0);
    expect(listGeneratedTsConfigs()).toEqual([]);
  });

  describe(`#main`, () => {
    const originalCwd = process.cwd();
    const originalExitCode = process.exitCode;

    afterEach(() => {
      process.chdir(originalCwd);
      process.exitCode = originalExitCode;
    });

    it.each(['-p', '--project'])(`should reject "%s" without a value instead of silently falling back`, flag => {
      expect(() => main([flag])).toThrow(/"(-p|--project)" requires a value/);
    });

    it(`should not throw the argv-validation error when "-p"/"--project" is given a value`, () => {
      fs.mkdirSync(path.join(appRoot, 'node_modules/@proj/dep'), { recursive: true });
      fs.writeFileSync(
        path.join(appRoot, 'node_modules/@proj/dep/package.json'),
        JSON.stringify({ name: '@proj/dep', version: '1.0.0', types: './index.d.ts', main: './index.js' }),
        'utf-8',
      );
      fs.writeFileSync(
        path.join(appRoot, 'node_modules/@proj/dep/index.d.ts'),
        `export declare const dep: string;`,
        'utf-8',
      );

      process.chdir(appRoot);

      expect(() => main(['-p', 'tsconfig.json'])).not.toThrow();
      expect(process.exitCode).toEqual(0);
      expect(listGeneratedTsConfigs()).toEqual([]);
    });

    it(`should default to "tsconfig.json" when no "-p"/"--project" flag is given`, () => {
      fs.mkdirSync(path.join(appRoot, 'node_modules/@proj/dep'), { recursive: true });
      fs.writeFileSync(
        path.join(appRoot, 'node_modules/@proj/dep/package.json'),
        JSON.stringify({ name: '@proj/dep', version: '1.0.0', types: './index.d.ts', main: './index.js' }),
        'utf-8',
      );
      fs.writeFileSync(
        path.join(appRoot, 'node_modules/@proj/dep/index.d.ts'),
        `export declare const dep: string;`,
        'utf-8',
      );

      process.chdir(appRoot);

      expect(() => main([])).not.toThrow();
      expect(process.exitCode).toEqual(0);
    });
  });
});
