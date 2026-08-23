import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { workspaceRoot } from '@nx/devkit';

/**
 * Behavioural regression test for `typings/static-assets/index.d.ts`'s `declare module '*.css' {}` ambient
 * declaration.
 *
 * A shorthand ambient module (`declare module '*.css';`, no `{ }` body) makes every export of the matched
 * module `any`, so a value/default/named import from a plain stylesheet would silently type-check even
 * though bundlers only ever inject plain CSS for its side effect. The declaration must keep an explicit
 * empty body so a side-effect only import still resolves, while a named import fails to resolve and a
 * default import's type carries no properties (so property access on it is still rejected).
 */
describe(`typings/static-assets '*.css' ambient module`, () => {
  let root: string;

  function createTsConfig() {
    fs.writeFileSync(
      path.join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2019',
          module: 'esnext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          // mirrors `tsconfig.base.json`'s `typeRoots`, pointed at the real workspace `typings` folder so
          // this test exercises the actual declaration file instead of a copy of it
          typeRoots: [path.join(workspaceRoot, 'typings')],
          types: ['static-assets'],
        },
        include: ['*.ts'],
      }),
      'utf-8',
    );
  }

  function runTsc() {
    return spawnSync(process.execPath, [require.resolve('typescript/lib/tsc.js'), '-p', '.', '--noEmit'], {
      cwd: root,
      encoding: 'utf-8',
    });
  }

  beforeEach(() => {
    // written under the OS temp directory (never inside a source tree) so an interrupted run cannot leave
    // fixture files behind for git/tsconfig to pick up
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'static-assets-css-'));
    fs.writeFileSync(path.join(root, 'style.css'), '', 'utf-8');
    createTsConfig();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it(`accepts a side-effect only import`, () => {
    fs.writeFileSync(path.join(root, 'index.ts'), [`import './style.css';`, `export {};`].join('\n'), 'utf-8');

    const result = runTsc();

    expect(result.stdout).toEqual('');
    expect(result.status).toEqual(0);
  });

  it(`does not let a default import silently become 'any'`, () => {
    fs.writeFileSync(
      path.join(root, 'index.ts'),
      // `moduleResolution: bundler` allows a default import to bind to the (empty) module namespace object
      // instead of erroring outright - the regression this guards is that binding being `any`, which would
      // let property access through unchecked. The property access below must still be rejected.
      [`import styles from './style.css';`, `export const value: string = styles.foo;`].join('\n'),
      'utf-8',
    );

    const result = runTsc();

    expect(result.status).not.toEqual(0);
    expect(result.stdout).toMatch(/Property 'foo' does not exist on type/);
  });

  it(`rejects a named import`, () => {
    fs.writeFileSync(
      path.join(root, 'index.ts'),
      [`import { theme } from './style.css';`, `export { theme };`].join('\n'),
      'utf-8',
    );

    const result = runTsc();

    expect(result.status).not.toEqual(0);
    expect(result.stdout).toMatch(/has no exported member/);
  });

  it(`still accepts a default import from a CSS module (regression check)`, () => {
    fs.writeFileSync(path.join(root, 'style.module.css'), '', 'utf-8');
    fs.writeFileSync(
      path.join(root, 'index.ts'),
      [`import styles from './style.module.css';`, `export const className: string = styles.foo;`].join('\n'),
      'utf-8',
    );

    const result = runTsc();

    expect(result.stdout).toEqual('');
    expect(result.status).toEqual(0);
  });
});
