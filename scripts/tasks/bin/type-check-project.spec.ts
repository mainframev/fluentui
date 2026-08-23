import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

/**
 * `bin/type-check-project.js` is a plain (`@ts-check`'d, but untranspiled) Node.js CLI entry point,
 * not part of any TS project the compiler builds - so it needs its own direct coverage: a syntax
 * check (it's the sort of file that's easy to break without anyone noticing, since it's neither
 * compiled nor executed by `tsc`/jest by default), plus a wiring test that it registers the
 * workspace's TS project and delegates to `../src/type-check-project`'s `main()`.
 */
describe(`bin/type-check-project.js`, () => {
  const binPath = path.join(__dirname, 'type-check-project.js');

  it(`should be valid, executable JavaScript`, () => {
    const result = spawnSync(process.execPath, ['--check', binPath], { encoding: 'utf-8' });

    expect(result.stderr).toEqual('');
    expect(result.status).toEqual(0);
  });

  it(`should register the workspace TS project and delegate to type-check-project's main()`, () => {
    jest.resetModules();

    const registerTsProject = jest.fn();
    const main = jest.fn();

    jest.doMock('@nx/devkit', () => ({ joinPathFragments: (...segments: string[]) => path.join(...segments) }));
    jest.doMock('@nx/js/src/internal', () => ({ registerTsProject }));
    jest.doMock('../src/type-check-project', () => ({ main }));

    jest.isolateModules(() => {
      require('./type-check-project');
    });

    expect(registerTsProject).toHaveBeenCalledWith(path.join(__dirname, '..', 'tsconfig.lib.json'));
    expect(main).toHaveBeenCalledTimes(1);

    jest.dontMock('@nx/devkit');
    jest.dontMock('@nx/js/src/internal');
    jest.dontMock('../src/type-check-project');
  });
});
