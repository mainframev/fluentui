import { detectModuleShape, findSyntaxAboveTarget } from './ecma-syntax';

describe(`ecma-syntax`, () => {
  describe(`#findSyntaxAboveTarget`, () => {
    it.each([
      [`var a = function () {};`, []],
      [`const a = 1;`, ['ConstDeclaration']],
      [`let a = 1;`, ['LetDeclaration']],
      [`var a = () => 1;`, ['ArrowFunction']],
      ['var a = `hello`;', ['NoSubstitutionTemplateLiteral']],
      [`class A {}`, ['ClassDeclaration']],
      [`var a = [...b];`, ['SpreadElement']],
      [`function a(...rest) {}`, ['RestParameter']],
      [`function a(b = 1) {}`, ['DefaultParameter']],
      [`for (var a of b) {}`, ['ForOfStatement']],
    ])(`should report %j as above ES5`, (code, expected) => {
      expect(findSyntaxAboveTarget(code, 'es5').map(feature => feature.name)).toEqual(expected);
    });

    it(`should not report syntax which the target supports`, () => {
      const code = [`const a = () => 1;`, `class B {}`, `var c = { ...d };`].join('\n');

      expect(findSyntaxAboveTarget(code, 'es2018')).toEqual([]);
      expect(findSyntaxAboveTarget(code, 'es2015').map(feature => feature.name)).toEqual(['SpreadAssignment']);
    });

    it(`should report the minimum target of each construct`, () => {
      expect(findSyntaxAboveTarget(`var a = b?.c ?? d;`, 'es2019')).toEqual([
        { name: 'NullishCoalescing', minTarget: 'es2020' },
        { name: 'OptionalChaining', minTarget: 'es2020' },
      ]);
      expect(findSyntaxAboveTarget(`async function a() { await b; }`, 'es2016').map(f => f.minTarget)).toEqual([
        'es2017',
        'es2017',
      ]);
      expect(findSyntaxAboveTarget(`try { a(); } catch { }`, 'es2018').map(f => f.name)).toEqual([
        'OptionalCatchBinding',
      ]);
      // `class` itself is ES2015, only the class field is ES2022
      expect(findSyntaxAboveTarget(`class A { b = 1; }`, 'es2021').map(f => f.name)).toEqual(['PropertyDeclaration']);
    });
  });

  describe(`#detectModuleShape`, () => {
    it(`should detect ESM`, () => {
      expect(detectModuleShape(`import a from './a';\nexport var b = a;`)).toEqual('esm');
      expect(detectModuleShape(`export * from './a';`)).toEqual('esm');
      expect(detectModuleShape(`var a = 1;\nexport { a };`)).toEqual('esm');
      expect(detectModuleShape(`export default 1;`)).toEqual('esm');
    });

    it(`should detect AMD`, () => {
      expect(detectModuleShape(`define(["require", "exports"], function (require, exports) {});`)).toEqual('amd');
      // the "use strict" prologue must not confuse the detection
      expect(detectModuleShape(`"use strict";\ndefine(["require"], function () {});`)).toEqual('amd');
    });

    it(`should detect CommonJS`, () => {
      expect(detectModuleShape(`"use strict";\nvar a = require("./a");\nexports.b = a;`)).toEqual('commonjs');
      expect(detectModuleShape(`module.exports = 1;`)).toEqual('commonjs');
    });

    it(`should detect plain scripts`, () => {
      expect(detectModuleShape(`"use strict";\nvar a = 1;`)).toEqual('script');
    });
  });
});
