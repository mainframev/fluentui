import * as fs from 'node:fs';
import * as path from 'node:path';

import * as ts from 'typescript';

import { transpileEmittedJs } from './transpile';

/**
 * ES2015+ syntax that must not be present in the ES5 baseline that v8 packages publish.
 */
function findModernSyntax(code: string) {
  const sourceFile = ts.createSourceFile('output.js', code, ts.ScriptTarget.ESNext, true);
  const modernSyntaxKinds = new Set([
    ts.SyntaxKind.ArrowFunction,
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.ClassExpression,
    ts.SyntaxKind.TemplateExpression,
    ts.SyntaxKind.NoSubstitutionTemplateLiteral,
    ts.SyntaxKind.SpreadElement,
    ts.SyntaxKind.SpreadAssignment,
    ts.SyntaxKind.ShorthandPropertyAssignment,
    ts.SyntaxKind.ObjectBindingPattern,
    ts.SyntaxKind.ArrayBindingPattern,
  ]);
  const found: string[] = [];

  const visit = (node: ts.Node) => {
    if (modernSyntaxKinds.has(node.kind)) {
      found.push(ts.SyntaxKind[node.kind]);
    }
    if (ts.isVariableDeclarationList(node)) {
      const declarationKeyword = node.getFirstToken()?.kind;

      if (declarationKeyword === ts.SyntaxKind.LetKeyword || declarationKeyword === ts.SyntaxKind.ConstKeyword) {
        found.push('LetOrConstDeclaration');
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);

  return found;
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

    const transpiledFiles = await transpileEmittedJs({
      root,
      inputPath: 'lib',
      outputPath: 'lib',
      module: 'es6',
      target: 'es5',
    });

    const actual = readFile('lib/index.js');

    expect(transpiledFiles).toEqual(['index.js']);
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

    const transpiledFiles = await transpileEmittedJs({
      root,
      inputPath: 'lib',
      outputPath: 'lib-amd',
      module: 'amd',
      target: 'es5',
    });

    const actual = readFile('lib-amd/index.js');

    expect(transpiledFiles.sort()).toEqual(['index.js', path.join('nested', 'other.js')]);
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
});
