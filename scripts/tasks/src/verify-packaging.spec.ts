import * as fs from 'node:fs';
import * as path from 'node:path';

import { verifyPackaging } from './verify-packaging';

jest.mock('node:child_process', () => ({ spawnSync: jest.fn() }));

const spawnSync: jest.Mock = jest.requireMock('node:child_process').spawnSync;

describe(`verifyPackaging`, () => {
  const tmpRoot = path.join(__dirname, '../tmp');
  const originalCwd = process.cwd();
  let root: string;

  const es5Esm = [
    `import { Base } from "./base";`,
    `export var Greeter = /*#__PURE__*/ function (Base) { return Base; }(Base);`,
  ].join('\n');
  const es5CommonJs = [`"use strict";`, `var _base = require("./base");`, `exports.greeter = _base.Base;`].join('\n');
  const es5Amd = [
    `define(["require", "exports", "./base"], function (require, exports, _base) {`,
    `  "use strict";`,
    `  exports.greeter = _base.Base;`,
    `});`,
  ].join('\n');
  const declaration = `export declare const greeter: string;`;

  function createFile(filePath: string, content: string) {
    fs.mkdirSync(path.dirname(path.join(root, filePath)), { recursive: true });
    fs.writeFileSync(path.join(root, filePath), content, 'utf-8');
  }

  function setup(
    options: {
      tags?: string[];
      target?: string;
      files?: Record<string, string>;
      /** files reported by `npm pack --dry-run` on top of the ones written to disk */
      extraPackedFiles?: string[];
      omitFromPack?: string[];
      dependencies?: Record<string, string>;
    } = {},
  ) {
    const {
      tags = ['v8', 'ships-es5'],
      target = 'es2015',
      extraPackedFiles = [],
      omitFromPack = [],
      dependencies,
    } = options;
    const files = options.files ?? {
      'lib/index.js': es5Esm,
      'lib/index.d.ts': declaration,
      'lib-commonjs/index.js': es5CommonJs,
      'lib-commonjs/index.d.ts': declaration,
      'lib-amd/index.js': es5Amd,
      'lib-amd/index.d.ts': declaration,
    };

    createFile(
      'package.json',
      JSON.stringify({ name: '@proj/one', version: '1.0.0', main: 'lib-commonjs/index.js', dependencies }),
    );
    createFile('project.json', JSON.stringify({ name: 'one', tags }));
    createFile('tsconfig.json', JSON.stringify({ compilerOptions: { target } }));
    createFile('CHANGELOG.md', '# changelog');
    createFile('README.md', '# readme');
    createFile('LICENSE', 'MIT');
    createFile('dist/index.d.ts', declaration);

    for (const [filePath, content] of Object.entries(files)) {
      createFile(filePath, content);
    }

    const packedFiles = [
      'LICENSE',
      'README.md',
      'CHANGELOG.md',
      'package.json',
      'dist/index.d.ts',
      ...Object.keys(files),
      ...extraPackedFiles,
    ].filter(filePath => !omitFromPack.includes(filePath));

    spawnSync.mockReturnValue({
      output: ['', `${packedFiles.map(filePath => `npm notice 1.2kB ${filePath}`).join('\n')}\n`, ''],
    });
  }

  beforeEach(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    root = fs.mkdtempSync(path.join(tmpRoot, 'verify-packaging-'));
    process.chdir(root);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(root, { recursive: true, force: true });
    spawnSync.mockReset();
  });

  it(`should pass for artifacts which match the published contract`, () => {
    setup();

    expect(() => verifyPackaging({ production: true })).not.toThrow();
  });

  it(`should fail if the ES5 downlevel did not run`, () => {
    setup({
      files: {
        'lib/index.js': `export const greeter = () => 'hi';`,
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: false })).toThrow(/"lib\/index.js" is emitted for "es5"/);
  });

  it(`should verify the compiler target of packages which are not on the ES5 baseline`, () => {
    const es2019 = `export const greeter = () => 'hi';`;

    setup({
      tags: ['v8'],
      target: 'ES2019',
      files: {
        'lib/index.js': es2019,
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: false })).not.toThrow();

    setup({
      tags: ['v8'],
      target: 'ES2019',
      files: {
        'lib/index.js': `export const greeter = other?.value;`,
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: false })).toThrow(/is emitted for "es2019"/);
  });

  it(`should fail if the AMD artifact is not AMD wrapped`, () => {
    setup({
      files: {
        'lib/index.js': es5Esm,
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
        'lib-amd/index.js': es5CommonJs,
        'lib-amd/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: true })).toThrow(
      /"lib-amd\/index.js" is emitted as "amd" module, got "commonjs"/,
    );
  });

  it(`should fail if the AMD artifact does not mirror the ESM one`, () => {
    setup({
      files: {
        'lib/index.js': es5Esm,
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
        'lib-amd/index.js': es5Amd,
        'lib-amd/index.d.ts': declaration,
        'lib-amd/stale.js': es5Amd,
        'lib-amd/stale.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: true })).toThrow(/"lib-amd" mirrors "lib".*stale.js/s);
  });

  it(`should fail if an emitted helper import cannot be resolved`, () => {
    setup({
      dependencies: { '@swc/helpers': '^0.5.23' },
      files: {
        'lib/index.js': [
          `import { _ as _call_super } from "@swc/helpers/_/__not_a_helper__";`,
          `export var Greeter = function () {};`,
        ].join('\n'),
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: false })).toThrow(
      /every runtime helper imported by "lib" is provided by the declared "@swc\/helpers" dependency/,
    );
  });

  it(`should fail if the package imports runtime helpers without declaring "@swc/helpers"`, () => {
    setup({
      files: {
        'lib/index.js': [
          `import { _ as _class_call_check } from "@swc/helpers/_/_class_call_check";`,
          `export var Greeter = function () {};`,
        ].join('\n'),
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: false })).toThrow(
      /"lib" imports @swc\/helpers runtime helpers.*but the package does not declare "@swc\/helpers" as a dependency/s,
    );
  });

  it(`should fail if the declared "@swc/helpers" range does not accept the resolved helper version`, () => {
    setup({
      // the installed/resolved copy of @swc/helpers (0.5.23) is verified to provide `_class_call_check`,
      // but this range only accepts the "0.4.x" line - a consumer resolving this range would never
      // actually get the version that was verified to provide the imported helper
      dependencies: { '@swc/helpers': '^0.4.0' },
      files: {
        'lib/index.js': [
          `import { _ as _class_call_check } from "@swc/helpers/_/_class_call_check";`,
          `export var Greeter = function () {};`,
        ].join('\n'),
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: false })).toThrow(
      /declared "@swc\/helpers" dependency \("\^0\.4\.0"\) permits versions older than "0\.5\.23"/,
    );
  });

  it(`should accept helper imports which the declared dependency provides`, () => {
    setup({
      dependencies: { '@swc/helpers': '^0.5.23' },
      files: {
        'lib/index.js': [
          `import { _ as _class_call_check } from "@swc/helpers/_/_class_call_check";`,
          `export var Greeter = function () {};`,
        ].join('\n'),
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: false })).not.toThrow();
  });

  it(`should fail if the declared range permits helper versions older than the required floor`, () => {
    setup({
      dependencies: { '@swc/helpers': '^0.5.1' },
      files: {
        'lib/index.js': [
          `import { _ as _class_call_check } from "@swc/helpers/_/_class_call_check";`,
          `export var Greeter = function () {};`,
        ].join('\n'),
        'lib/index.d.ts': declaration,
        'lib-commonjs/index.js': es5CommonJs,
        'lib-commonjs/index.d.ts': declaration,
      },
    });

    expect(() => verifyPackaging({ production: false })).toThrow(
      /declared "@swc\/helpers" dependency \("\^0\.5\.1"\) permits versions older than "0\.5\.23"/,
    );
  });

  it(`should fail if a module ships without its declaration`, () => {
    setup({ omitFromPack: ['lib-commonjs/index.d.ts'] });

    expect(() => verifyPackaging({ production: true })).toThrow(
      /every published "lib-commonjs" module ships its declaration counterpart/,
    );
  });

  it(`should not verify artifacts of private packages`, () => {
    setup({
      files: {
        'lib/index.js': `export const greeter = () => 'hi';`,
        'lib-commonjs/index.js': es5CommonJs,
      },
    });
    createFile('package.json', JSON.stringify({ name: '@proj/one', version: '1.0.0', private: true }));

    expect(() => verifyPackaging({ production: true })).not.toThrow();
  });
});
