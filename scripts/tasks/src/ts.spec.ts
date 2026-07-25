import * as fs from 'node:fs';
import * as path from 'node:path';

import { getJustArgv } from './argv';
import { findSyntaxAboveTarget } from './ecma-syntax';
import { ts } from './ts';

jest.mock('just-scripts', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), verbose: jest.fn() },
  tscTask: jest.fn((_options: unknown) => () => Promise.resolve()),
}));
jest.mock('./argv', () => ({ getJustArgv: jest.fn(() => ({})) }));

const tscTask: jest.Mock = jest.requireMock('just-scripts').tscTask;
const getJustArgvMock = getJustArgv as jest.MockedFunction<typeof getJustArgv>;

describe(`ts`, () => {
  const tmpRoot = path.join(__dirname, '../tmp');
  let root: string;

  const esmOutput = [
    `import { Base } from './base';`,
    `export const greet = (name) => \`hello \${name}\`;`,
    `export class Greeter extends Base {}`,
  ].join('\n');
  const commonjsOutput = [
    `"use strict";`,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    `const greet = (name) => \`hello \${name}\`;`,
    `exports.greet = greet;`,
  ].join('\n');

  function createFile(filePath: string, content: string) {
    fs.mkdirSync(path.dirname(path.join(root, filePath)), { recursive: true });
    fs.writeFileSync(path.join(root, filePath), content, 'utf-8');
  }
  function readFile(filePath: string) {
    return fs.readFileSync(path.join(root, filePath), 'utf-8');
  }
  function listGeneratedTsConfigs() {
    return fs.readdirSync(root).filter(fileName => fileName.startsWith('tsconfig.__generated'));
  }

  const originalCwd = process.cwd();

  beforeEach(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    root = fs.mkdtempSync(path.join(tmpRoot, 'ts-task-'));
    // the tasks resolve every path (including the tsconfig passed to `tsc`) relative to the cwd
    process.chdir(root);
    getJustArgvMock.mockReturnValue({});
    tscTask.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.chdir(originalCwd);
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe(`compilation`, () => {
    it(`should not use compiler options removed in TypeScript 6`, () => {
      createFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));
      createFile('package.json', JSON.stringify({ name: '@proj/one' }));

      ts.esm();
      ts.commonjs();

      const [esmOptions, commonjsOptions] = tscTask.mock.calls.map(([options]) => options);

      expect(esmOptions).toEqual(expect.objectContaining({ outDir: 'lib', module: 'esnext' }));
      expect(commonjsOptions).toEqual(expect.objectContaining({ outDir: 'lib-commonjs', module: 'commonjs' }));

      for (const options of [esmOptions, commonjsOptions]) {
        // `target: es5` and `module: amd` were removed in TS 6 - both are produced by the swc based `downlevel`/`amd` tasks
        expect(options.target).toBeUndefined();
        expect(options.module).not.toEqual('amd');
      }
    });

    it(`should compile projects which use path aliases for DX without them`, async () => {
      createFile('tsconfig.json', JSON.stringify({ extends: '../../tsconfig.base.v8.json', compilerOptions: {} }));
      createFile('package.json', JSON.stringify({ name: '@proj/one' }));

      const task = ts.commonjs();
      const [options] = tscTask.mock.calls[0];

      expect(options.rootDir).toEqual('./src');
      expect(options.project).toMatch(/tsconfig\.__generated-no-path-aliases-build-.*-tsconfig\.json$/);
      expect(JSON.parse(readFile(path.basename(options.project)))).toEqual({
        extends: './tsconfig.json',
        compilerOptions: { paths: null },
      });

      // the transient config is removed as soon as the compilation finished - not on process exit
      await (task as unknown as () => Promise<void>)();

      expect(listGeneratedTsConfigs()).toEqual([]);
    });

    it(`should remove the transient tsconfig even if the compilation failed`, async () => {
      createFile('tsconfig.json', JSON.stringify({ extends: '../../tsconfig.base.v8.json', compilerOptions: {} }));
      createFile('package.json', JSON.stringify({ name: '@proj/one' }));

      tscTask.mockImplementationOnce(() => () => Promise.reject(new Error('tsc failed')));

      const task = ts.commonjs();

      await expect((task as unknown as () => Promise<void>)()).rejects.toThrow('tsc failed');
      expect(listGeneratedTsConfigs()).toEqual([]);
    });

    it(`should remove the transient tsconfig for a thenable (non-native-Promise) task result`, async () => {
      createFile('tsconfig.json', JSON.stringify({ extends: '../../tsconfig.base.v8.json', compilerOptions: {} }));
      createFile('package.json', JSON.stringify({ name: '@proj/one' }));

      // a spec-compliant thenable which is not an `instanceof Promise` - eg what some task runners/zones return
      const thenable = { then: (onFulfilled: (value: void) => void) => onFulfilled(undefined) };
      tscTask.mockImplementationOnce(() => () => thenable);

      const task = ts.commonjs();

      await (task as unknown as () => Promise<void>)();

      expect(listGeneratedTsConfigs()).toEqual([]);
    });
  });

  describe(`#downlevel`, () => {
    it(`should downlevel every compiled module output to ES5 in place`, async () => {
      createFile('lib/index.js', esmOutput);
      createFile('lib-commonjs/index.js', commonjsOutput);

      await ts.downlevel();

      expect(readFile('lib/index.js')).toContain(`import { Base } from './base'`);
      expect(findSyntaxAboveTarget(readFile('lib/index.js'), 'es5')).toEqual([]);
      expect(readFile('lib-commonjs/index.js')).toContain('exports.greet');
      expect(findSyntaxAboveTarget(readFile('lib-commonjs/index.js'), 'es5')).toEqual([]);
    });

    it(`should skip module outputs which were not compiled`, async () => {
      createFile('lib/index.js', esmOutput);

      await expect(ts.downlevel()).resolves.not.toThrow();

      expect(fs.existsSync(path.join(root, 'lib-commonjs'))).toBe(false);
    });

    it(`should honour the --module flag`, async () => {
      getJustArgvMock.mockReturnValue({ module: { esm: false, cjs: true, amd: false } });
      createFile('lib/index.js', esmOutput);
      createFile('lib-commonjs/index.js', commonjsOutput);

      await ts.downlevel();

      expect(readFile('lib/index.js')).toEqual(esmOutput);
      expect(findSyntaxAboveTarget(readFile('lib-commonjs/index.js'), 'es5')).toEqual([]);
    });

    it(`should be idempotent`, async () => {
      createFile('lib/index.js', esmOutput);

      await ts.downlevel();
      const firstRun = readFile('lib/index.js');

      await ts.downlevel();

      expect(readFile('lib/index.js')).toEqual(firstRun);
    });
  });

  describe(`#amd`, () => {
    it(`should create ES5 AMD output including declarations from the ESM output`, async () => {
      createFile('lib/index.js', esmOutput);
      createFile('lib/index.d.ts', `export declare const greet: (name: string) => string;`);
      createFile('lib/nested/other.js', esmOutput);
      createFile('lib/nested/other.d.ts', `export declare const other: string;`);

      await ts.amd();

      expect(readFile('lib-amd/index.js')).toMatch(/^define\(\[/);
      expect(findSyntaxAboveTarget(readFile('lib-amd/index.js'), 'es5')).toEqual([]);
      expect(readFile('lib-amd/nested/other.js')).toMatch(/^define\(\[/);
      // declarations are module format agnostic, so they are copied over as is
      expect(readFile('lib-amd/index.d.ts')).toEqual(readFile('lib/index.d.ts'));
      expect(readFile('lib-amd/nested/other.d.ts')).toEqual(readFile('lib/nested/other.d.ts'));
    });

    it(`should prune stale amd files and declarations`, async () => {
      createFile('lib/index.js', esmOutput);
      createFile('lib/index.d.ts', `export declare const greet: (name: string) => string;`);
      createFile('lib/removed.js', esmOutput);
      createFile('lib/removed.d.ts', `export declare const removed: string;`);

      await ts.amd();

      fs.rmSync(path.join(root, 'lib/removed.js'));
      fs.rmSync(path.join(root, 'lib/removed.d.ts'));

      await ts.amd();

      expect(fs.existsSync(path.join(root, 'lib-amd/removed.js'))).toBe(false);
      expect(fs.existsSync(path.join(root, 'lib-amd/removed.d.ts'))).toBe(false);
      expect(fs.existsSync(path.join(root, 'lib-amd/index.js'))).toBe(true);
      expect(fs.existsSync(path.join(root, 'lib-amd/index.d.ts'))).toBe(true);
    });

    it(`should throw if there is no ESM output to convert`, async () => {
      await expect(ts.amd()).rejects.toThrow(/cannot transpile "lib" -> "lib-amd"/);
    });
  });
});
