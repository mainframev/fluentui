import * as fs from 'node:fs';
import * as path from 'node:path';

import { getJustArgv } from './argv';
import { ts } from './ts';

jest.mock('just-scripts', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), verbose: jest.fn() },
  tscTask: jest.fn((options: unknown) => options),
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

  beforeEach(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    root = fs.mkdtempSync(path.join(tmpRoot, 'ts-task-'));
    jest.spyOn(process, 'cwd').mockReturnValue(root);
    getJustArgvMock.mockReturnValue({});
    tscTask.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
  });

  describe(`#downlevel`, () => {
    it(`should downlevel every compiled module output to ES5 in place`, async () => {
      createFile('lib/index.js', esmOutput);
      createFile('lib-commonjs/index.js', commonjsOutput);

      await ts.downlevel();

      expect(readFile('lib/index.js')).toContain(`import { Base } from './base'`);
      expect(readFile('lib/index.js')).not.toContain('=>');
      expect(readFile('lib-commonjs/index.js')).toContain('exports.greet');
      expect(readFile('lib-commonjs/index.js')).not.toContain('=>');
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
      expect(readFile('lib-commonjs/index.js')).not.toContain('=>');
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
      expect(readFile('lib-amd/index.js')).not.toContain('=>');
      expect(readFile('lib-amd/nested/other.js')).toMatch(/^define\(\[/);
      // declarations are module format agnostic, so they are copied over as is
      expect(readFile('lib-amd/index.d.ts')).toEqual(readFile('lib/index.d.ts'));
      expect(readFile('lib-amd/nested/other.d.ts')).toEqual(readFile('lib/nested/other.d.ts'));
    });

    it(`should throw if there is no ESM output to convert`, async () => {
      await expect(ts.amd()).rejects.toThrow(/cannot transpile "lib" -> "lib-amd"/);
    });
  });
});
