import { logger, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from 'nx/src/devkit-testing-exports';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createTsConfigWithoutPathAliases,
  getWorkspaceConfig,
  getProjectNameWithoutScope,
  printUserLogs,
} from './utils';

describe(`utils`, () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = () => {};

  describe(`#getWorkspaceConfig`, () => {
    let tree: Tree;
    beforeEach(() => {
      tree = createTreeWithEmptyWorkspace();
    });
    it(`should return nx config with some package.json metadata`, () => {
      const actual = getWorkspaceConfig(tree);
      expect(actual).toMatchInlineSnapshot(`
        Object {
          "affected": Object {
            "defaultBase": "main",
          },
          "npmScope": "proj",
          "targetDefaults": Object {
            "build": Object {
              "cache": true,
            },
            "lint": Object {
              "cache": true,
            },
          },
        }
      `);
    });
  });

  describe(`#getProjectNameWithoutScope`, () => {
    it(`should return project name without scope`, () => {
      let actual = getProjectNameWithoutScope('@proj/one-foo');

      expect(actual).toEqual('one-foo');

      actual = getProjectNameWithoutScope('two-foo');
      expect(actual).toEqual('two-foo');
    });
  });

  describe(`#printUserLogs`, () => {
    beforeEach(() => {
      jest.restoreAllMocks();

      jest.spyOn(console, 'log').mockImplementation(noop);
      jest.spyOn(console, 'info').mockImplementation(noop);
      jest.spyOn(console, 'warn').mockImplementation(noop);
      jest.spyOn(console, 'error').mockImplementation(noop);
    });

    it(`should print nothing if logs are empty`, () => {
      const loggerInfoSpy = jest.spyOn(logger, 'info');
      printUserLogs([]);

      expect(loggerInfoSpy).not.toHaveBeenCalled();
    });

    it(`should print logs based on type`, () => {
      const loggerInfoSpy = jest.spyOn(logger, 'info');
      const loggerWarnSpy = jest.spyOn(logger, 'warn');
      const loggerErrorSpy = jest.spyOn(logger, 'error');
      printUserLogs([
        { type: 'info', message: 'info log' },
        { type: 'warn', message: 'warn log' },
        { type: 'error', message: 'error log' },
      ]);

      expect(loggerInfoSpy).toHaveBeenCalledWith('info log');
      expect(loggerWarnSpy).toHaveBeenCalledWith('warn log');
      expect(loggerErrorSpy).toHaveBeenCalledWith('error log');
    });
  });

  describe('#createTsConfigWithoutPathAliases', () => {
    let projectRoot: string;

    beforeEach(() => {
      projectRoot = mkdtempSync(join(__dirname, '__tmp-ts6-no-path-aliases-'));
      writeFileSync(join(projectRoot, 'tsconfig.lib.json'), JSON.stringify({ include: ['src'] }), 'utf-8');
    });

    afterEach(() => {
      rmSync(projectRoot, { recursive: true, force: true });
    });

    it('should create a transient config which extends the original one and nulls path aliases', () => {
      const tsConfigPath = join(projectRoot, 'tsconfig.lib.json');

      const actual = createTsConfigWithoutPathAliases(tsConfigPath, 'type-check');

      expect(actual.path).toEqual(
        join(projectRoot, 'tsconfig.__generated-no-path-aliases-type-check-tsconfig.lib.json'),
      );
      expect(JSON.parse(readFileSync(actual.path, 'utf-8'))).toEqual({
        extends: './tsconfig.lib.json',
        compilerOptions: { paths: null },
      });
    });

    it('should remove the transient config on cleanup', () => {
      const actual = createTsConfigWithoutPathAliases(join(projectRoot, 'tsconfig.lib.json'), 'generate-api');

      expect(existsSync(actual.path)).toBe(true);

      actual.cleanup();

      expect(existsSync(actual.path)).toBe(false);
    });
  });
});
