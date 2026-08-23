import * as fs from 'node:fs';
import * as path from 'node:path';

import { findSyntaxAboveTarget } from '../ecma-syntax';

import { transpileEmittedJs } from './transpile';

function findModernSyntax(code: string) {
  return findSyntaxAboveTarget(code, 'es5').map(feature => feature.name);
}

describe(`transpileEmittedJs`, () => {
  const tmpRoot = path.join(__dirname, '../../tmp');
  let root: string;

  /**
   * mimics `tsc` ESM emit with `target: ES2015` + `sourceMap` + `inlineSources`
   */
  const esmOutput = [
    `import { Base } from './base';`,
    `export class Greeter extends Base {`,
    `  greet = (name) => \`hello \${name}\`;`,
    `}`,
    `//# sourceMappingURL=index.js.map`,
  ].join('\n');

  const commonjsOutput = [
    `"use strict";`,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    `exports.greet = void 0;`,
    `const base_1 = require("./base");`,
    `const greet = (name) => \`hello \${name}\`;`,
    `exports.greet = greet;`,
    `//# sourceMappingURL=index.js.map`,
  ].join('\n');

  const sourceMap = JSON.stringify({
    version: 3,
    file: 'index.js',
    sourceRoot: '../src/',
    sources: ['index.ts'],
    names: [],
    mappings: 'AAAA',
    sourcesContent: [`export const greet = (name: string) => \`hello \${name}\`;`],
  });

  function createFile(filePath: string, content: string) {
    fs.mkdirSync(path.dirname(path.join(root, filePath)), { recursive: true });
    fs.writeFileSync(path.join(root, filePath), content, 'utf-8');
  }

  function readFile(filePath: string) {
    return fs.readFileSync(path.join(root, filePath), 'utf-8');
  }

  beforeEach(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    root = fs.mkdtempSync(path.join(tmpRoot, 'transpile-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it(`should downlevel ESM output in place and keep the module format`, async () => {
    createFile('lib/index.js', esmOutput);
    createFile('lib/index.js.map', sourceMap);

    const result = await transpileEmittedJs({
      root,
      inputPath: 'lib',
      outputPath: 'lib',
      module: 'es6',
      target: 'es5',
    });

    const actual = readFile('lib/index.js');

    expect(result.files).toEqual(['index.js']);
    expect(result.transpiled).toEqual(['index.js']);
    // module format is untouched
    expect(actual).toContain(`import { Base } from './base'`);
    expect(actual).toContain('export');
    // ES2015+ syntax is gone
    expect(findModernSyntax(actual)).toEqual([]);
  });

  it(`should downlevel CommonJS output in place without re-wrapping it`, async () => {
    createFile('lib-commonjs/index.js', commonjsOutput);
    createFile('lib-commonjs/index.js.map', sourceMap);

    await transpileEmittedJs({
      root,
      inputPath: 'lib-commonjs',
      outputPath: 'lib-commonjs',
      module: 'commonjs',
      target: 'es5',
    });

    const actual = readFile('lib-commonjs/index.js');

    expect(actual).toContain(`require("./base")`);
    expect(actual).toContain('exports.greet');
    expect(findModernSyntax(actual)).toEqual([]);
    // it's a script, not an ESM module wrapped into cjs
    expect(actual).not.toContain('_interop_require_default');
  });

  it(`should create AMD output from ESM output`, async () => {
    createFile('lib/index.js', esmOutput);
    createFile('lib/index.js.map', sourceMap);
    createFile('lib/nested/other.js', esmOutput);
    createFile('lib/nested/other.js.map', sourceMap);

    const result = await transpileEmittedJs({
      root,
      inputPath: 'lib',
      outputPath: 'lib-amd',
      module: 'amd',
      target: 'es5',
    });

    const actual = readFile('lib-amd/index.js');

    expect(result.files.sort()).toEqual(['index.js', path.join('nested', 'other.js')]);
    expect(actual).toMatch(/^define\(\[/);
    expect(findModernSyntax(actual)).toEqual([]);
    // source output is left untouched
    expect(readFile('lib/index.js')).toEqual(esmOutput);
    expect(fs.existsSync(path.join(root, 'lib-amd/nested/other.js'))).toBe(true);
  });

  it(`should chain source maps of the compiler emitted output`, async () => {
    createFile('lib/index.js', esmOutput);
    createFile('lib/index.js.map', sourceMap);

    await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib-amd', module: 'amd', target: 'es5' });

    const actual = readFile('lib-amd/index.js');
    const actualSourceMap = JSON.parse(readFile('lib-amd/index.js.map'));

    // the `//# sourceMappingURL` comment of the input must not end up within the AMD module factory
    expect(actual.match(/\/\/# sourceMappingURL/g)).toHaveLength(1);
    expect(actual.endsWith('//# sourceMappingURL=index.js.map')).toBe(true);

    expect(actualSourceMap.sources).toEqual(['index.ts']);
    expect(actualSourceMap.sourceRoot).toEqual('../src/');
    expect(actualSourceMap.sourcesContent[0]).toContain('const greet');
  });

  it(`should not emit source maps if the compiler didn't`, async () => {
    createFile('lib/index.js', `export var noop = function () {};`);

    await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib-amd', module: 'amd', target: 'es5' });

    expect(readFile('lib-amd/index.js')).not.toContain('sourceMappingURL');
    expect(fs.existsSync(path.join(root, 'lib-amd/index.js.map'))).toBe(false);
  });

  it(`should throw an actionable error if there is no compiler output to transpile`, async () => {
    await expect(
      transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib-amd', module: 'amd', target: 'es5' }),
    ).rejects.toThrow(/cannot transpile "lib" -> "lib-amd".*tsc compilation needs to run first/s);
  });

  describe(`helpers`, () => {
    /**
     * v8 packages are maintenance-only, so the pipeline inlines the downlevel/module helpers
     * rather than adding `@swc/helpers` as a new runtime dependency to every published package.
     */
    it(`should inline helpers instead of importing them from @swc/helpers`, async () => {
      const files = ['a.js', 'b.js', 'c.js'];

      for (const fileName of files) {
        createFile(`lib/${fileName}`, esmOutput);
      }

      await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib', module: 'es6', target: 'es5' });

      for (const fileName of files) {
        const actual = readFile(`lib/${fileName}`);

        // helper is inlined as a local function, not imported from `@swc/helpers`
        expect(actual).not.toMatch(/from ["']@swc\/helpers/);
        expect(actual).toMatch(/function _class_call_check\(/);
      }
    });

    it(`should inline helpers in AMD output as well`, async () => {
      createFile('lib/index.js', esmOutput);

      await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib-amd', module: 'amd', target: 'es5' });

      const actual = readFile('lib-amd/index.js');

      // the AMD dependency list (everything up to the first `]`) declares no `@swc/helpers` module
      const amdDependencies = actual.slice(0, actual.indexOf(']'));
      expect(amdDependencies).not.toContain('@swc/helpers');
      expect(actual).toMatch(/function _class_call_check\(/);
    });
  });

  describe(`idempotency`, () => {
    it(`should not transpile already transpiled in place output again`, async () => {
      createFile('lib/index.js', esmOutput);
      createFile('lib/index.js.map', sourceMap);

      const first = await transpileEmittedJs({
        root,
        inputPath: 'lib',
        outputPath: 'lib',
        module: 'es6',
        target: 'es5',
      });
      const firstOutput = readFile('lib/index.js');

      const second = await transpileEmittedJs({
        root,
        inputPath: 'lib',
        outputPath: 'lib',
        module: 'es6',
        target: 'es5',
      });

      expect(first.transpiled).toEqual(['index.js']);
      expect(second.transpiled).toEqual([]);
      // the output (and its source map) is byte identical, it was not re-transformed nor re-chained
      expect(readFile('lib/index.js')).toEqual(firstOutput);
    });

    it(`should transpile again when the compiler emitted new output`, async () => {
      createFile('lib/index.js', esmOutput);

      await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib', module: 'es6', target: 'es5' });

      createFile('lib/index.js', `export const other = () => 'changed';`);

      const result = await transpileEmittedJs({
        root,
        inputPath: 'lib',
        outputPath: 'lib',
        module: 'es6',
        target: 'es5',
      });

      expect(result.transpiled).toEqual(['index.js']);
      expect(readFile('lib/index.js')).toContain('changed');
      expect(findModernSyntax(readFile('lib/index.js'))).toEqual([]);
    });

    it(`should transpile again when the target changed`, async () => {
      createFile('lib/index.js', esmOutput);

      await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib', module: 'es6', target: 'es5' });
      const result = await transpileEmittedJs({
        root,
        inputPath: 'lib',
        outputPath: 'lib',
        module: 'es6',
        target: 'es2015',
      });

      expect(result.transpiled).toEqual(['index.js']);
    });

    it(`should not transpile unchanged derived output again, but restore deleted files`, async () => {
      createFile('lib/index.js', esmOutput);
      createFile('lib/nested/other.js', esmOutput);

      await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib-amd', module: 'amd', target: 'es5' });

      fs.rmSync(path.join(root, 'lib-amd/nested/other.js'));

      const result = await transpileEmittedJs({
        root,
        inputPath: 'lib',
        outputPath: 'lib-amd',
        module: 'amd',
        target: 'es5',
      });

      expect(result.transpiled).toEqual([path.join('nested', 'other.js')]);
      expect(readFile('lib-amd/nested/other.js')).toMatch(/^define\(\[/);
    });
  });

  describe(`stale outputs`, () => {
    it(`should prune derived output which has no compiler emitted counterpart anymore`, async () => {
      createFile('lib/index.js', esmOutput);
      createFile('lib/removed.js', esmOutput);

      await transpileEmittedJs({ root, inputPath: 'lib', outputPath: 'lib-amd', module: 'amd', target: 'es5' });

      expect(fs.existsSync(path.join(root, 'lib-amd/removed.js'))).toBe(true);

      fs.rmSync(path.join(root, 'lib/removed.js'));

      const result = await transpileEmittedJs({
        root,
        inputPath: 'lib',
        outputPath: 'lib-amd',
        module: 'amd',
        target: 'es5',
      });

      expect(result.pruned).toEqual(['removed.js']);
      expect(fs.existsSync(path.join(root, 'lib-amd/removed.js'))).toBe(false);
      expect(fs.existsSync(path.join(root, 'lib-amd/index.js'))).toBe(true);
    });

    it(`should never prune in place output`, async () => {
      createFile('lib/index.js', esmOutput);

      const result = await transpileEmittedJs({
        root,
        inputPath: 'lib',
        outputPath: 'lib',
        module: 'es6',
        target: 'es5',
      });

      expect(result.pruned).toEqual([]);
      expect(fs.existsSync(path.join(root, 'lib/index.js'))).toBe(true);
    });
  });
});
