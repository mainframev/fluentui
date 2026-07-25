import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as path from 'path';

import { workspaceRoot } from '@nx/devkit';

import { createTsConfigWithoutPathAliases, getTsPathAliasesApiExtractorConfig } from './utils';

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;
describe(`utils`, () => {
  describe(`#getTsPathAliasesApiExtractorConfig`, () => {
    type Options = Parameters<typeof getTsPathAliasesApiExtractorConfig>[0];
    function setup(options: DeepPartial<Options> = {}) {
      const defaults = {
        tsConfig: {
          compilerOptions: {
            outDir: '../../dist/out-tsc',
            ...options.tsConfig?.compilerOptions,
          },
        },
        packageJson: {
          name: '@proj/one',
          version: '0.0.1',
          main: 'lib/index.js',
          dependencies: { ...options.packageJson?.dependencies },
          peerDependencies: { ...options.packageJson?.peerDependencies },
        },
        definitionsRootPath: options.definitionsRootPath ?? 'dist/types',
        pathAliasesTsConfigPath: options.pathAliasesTsConfigPath ?? undefined,
      };

      return getTsPathAliasesApiExtractorConfig(defaults as Options);
    }

    it(`should set compilerOptions`, () => {
      const actual = setup();

      expect(actual.overrideTsconfig.compilerOptions).toEqual(
        expect.objectContaining({ isolatedModules: false, skipLibCheck: false }),
      );
    });

    it(`should not use path aliases to emitted declaration files`, () => {
      const actual = setup({
        definitionsRootPath: 'dist/for/types',
      });

      expect(actual.overrideTsconfig.compilerOptions).toEqual(expect.objectContaining({ paths: undefined }));
    });

    // This is not used unless api-extractor resolves resolving workspace d.ts packages - see https://github.com/microsoft/rushstack/pull/3321, https://github.com/microsoft/rushstack/pull/3339
    it.skip(`should override path aliases to emitted declaration files instead of source files`, () => {
      const actual = setup({
        definitionsRootPath: 'dist/for/types',
        pathAliasesTsConfigPath: path.join(workspaceRoot, 'tsconfig.base.json'),
      });

      const newPaths = actual.overrideTsconfig.compilerOptions.paths as unknown as Record<string, string[]>;

      const newPath = Object.values(newPaths)[0][0];
      expect(newPath).toMatch(/^dist\/for\/types.+src\/index\.d\.ts$/i);
    });

    it(`should set allowSyntheticDefaultImports if package has invalid deps/peerDeps`, () => {
      const actual = setup({ packageJson: { dependencies: { '@storybook/api': '6.5.0' } } });
      expect(actual.overrideTsconfig.compilerOptions).toEqual(
        expect.objectContaining({ allowSyntheticDefaultImports: true }),
      );
    });
  });
  describe(`#createTsConfigWithoutPathAliases`, () => {
    const tmpRoot = path.join(__dirname, '../tmp');
    let projectRoot: string;

    beforeEach(() => {
      fs.mkdirSync(tmpRoot, { recursive: true });
      projectRoot = fs.mkdtempSync(path.join(tmpRoot, 'no-path-aliases-'));
      fs.writeFileSync(
        path.join(projectRoot, 'tsconfig.lib.json'),
        JSON.stringify({ compilerOptions: { outDir: './lib' }, include: ['src'] }),
        'utf-8',
      );
    });

    afterEach(() => {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    function listGenerated() {
      return fs.readdirSync(projectRoot).filter(fileName => fileName.startsWith('tsconfig.__generated'));
    }

    it(`should extend the original config and null path aliases`, () => {
      const actual = createTsConfigWithoutPathAliases(path.join(projectRoot, 'tsconfig.lib.json'), 'type-check');

      expect(path.dirname(actual.path)).toEqual(projectRoot);
      expect(path.basename(actual.path)).toMatch(
        /^tsconfig\.__generated-no-path-aliases-type-check-\d+-\d+-[a-f0-9]+-tsconfig\.lib\.json$/,
      );
      expect(JSON.parse(fs.readFileSync(actual.path, 'utf-8'))).toEqual({
        extends: './tsconfig.lib.json',
        compilerOptions: { paths: null },
      });

      actual.cleanup();
    });

    it(`should create a unique file per invocation, so concurrent tsc runs don't race`, () => {
      const first = createTsConfigWithoutPathAliases(path.join(projectRoot, 'tsconfig.lib.json'), 'type-check');
      const second = createTsConfigWithoutPathAliases(path.join(projectRoot, 'tsconfig.lib.json'), 'type-check');

      expect(first.path).not.toEqual(second.path);
      expect(listGenerated()).toHaveLength(2);

      first.cleanup();

      // cleaning up one must not remove the other one
      expect(fs.existsSync(second.path)).toBe(true);

      second.cleanup();

      expect(listGenerated()).toEqual([]);
    });

    it(`should be idempotent on repeated cleanup`, () => {
      const actual = createTsConfigWithoutPathAliases(path.join(projectRoot, 'tsconfig.lib.json'), 'build');

      actual.cleanup();

      expect(() => actual.cleanup()).not.toThrow();
    });

    it(`should throw if the config to extend doesn't exist`, () => {
      expect(() => createTsConfigWithoutPathAliases(path.join(projectRoot, 'tsconfig.nope.json'), 'build')).toThrow(
        /Cannot disable TS path aliases .* doesn't exist/,
      );
    });

    /**
     * `packages/web-components` and `packages/charts/chart-web-components` ship their own copy of
     * this helper (they must not depend on the `just` based v8 build tooling). The duplication is
     * intentional, their behaviour must not drift.
     */
    it.each([
      'packages/web-components/scripts/tsconfig-utils.js',
      'packages/charts/chart-web-components/scripts/tsconfig-utils.js',
    ])(`should be behaviourally aligned with %s`, helperPath => {
      const moduleUrl = pathToFileURL(path.join(workspaceRoot, helperPath)).href;
      const tsConfigPath = path.join(projectRoot, 'tsconfig.lib.json');
      const script = [
        `import { createTsConfigWithoutPathAliases } from ${JSON.stringify(moduleUrl)};`,
        `import fs from 'node:fs';`,
        `const first = createTsConfigWithoutPathAliases(${JSON.stringify(tsConfigPath)}, 'type-check');`,
        `const second = createTsConfigWithoutPathAliases(${JSON.stringify(tsConfigPath)}, 'type-check');`,
        `const content = JSON.parse(fs.readFileSync(first.path, 'utf-8'));`,
        `first.cleanup();`,
        `let error = null;`,
        `try { createTsConfigWithoutPathAliases(${JSON.stringify(
          path.join(projectRoot, 'tsconfig.nope.json'),
        )}, 'build'); } catch (err) { error = err.message; }`,
        `console.log(JSON.stringify({`,
        `  unique: first.path !== second.path,`,
        `  fileName: first.path.split('/').pop(),`,
        `  content,`,
        `  firstRemoved: !fs.existsSync(first.path),`,
        `  secondKept: fs.existsSync(second.path),`,
        `  error,`,
        `  listeners: { exit: process.listenerCount('exit'), sigint: process.listenerCount('SIGINT') },`,
        `}));`,
        // the leftover config must be removed by the process exit hook
      ].join('\n');

      const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf-8' });
      const actual = JSON.parse(output.trim().split('\n').pop() as string);

      expect(actual.unique).toBe(true);
      expect(actual.fileName).toMatch(
        /^tsconfig\.__generated-no-path-aliases-type-check-\d+-\d+-[a-f0-9]+-tsconfig\.lib\.json$/,
      );
      expect(actual.content).toEqual({ extends: './tsconfig.lib.json', compilerOptions: { paths: null } });
      expect(actual.firstRemoved).toBe(true);
      expect(actual.secondKept).toBe(true);
      expect(actual.error).toMatch(/Cannot disable TS path aliases .* doesn't exist/);
      expect(actual.listeners).toEqual({ exit: 1, sigint: 1 });
      // everything is cleaned up once the process exited
      expect(listGenerated()).toEqual([]);
    });

    it(`should register one process listener at most, no matter how many configs are created`, () => {
      const created: Array<{ path: string; cleanup: () => void }> = [];
      const countOwnListeners = () => ({
        exit: process.listeners('exit').filter(listener => listener.name === 'cleanupTransientTsConfigs').length,
        sigint: process.listeners('SIGINT').filter(listener => listener.name === 'cleanupTransientTsConfigsOnSignal')
          .length,
      });
      const before = countOwnListeners();

      // fresh module instance, so the (module scoped) listener registration happens within this test
      jest.isolateModules(() => {
        const utils: typeof import('./utils') = require('./utils');

        for (let i = 0; i < 20; i++) {
          created.push(utils.createTsConfigWithoutPathAliases(path.join(projectRoot, 'tsconfig.lib.json'), 'stress'));
        }
      });

      const after = countOwnListeners();

      expect(listGenerated()).toHaveLength(20);
      expect(after.exit - before.exit).toEqual(1);
      expect(after.sigint - before.sigint).toEqual(1);

      created.forEach(config => config.cleanup());

      expect(listGenerated()).toEqual([]);
    });
  });
});
