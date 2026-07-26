import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { OnResolveArgs, OnResolveResult, Plugin, PluginBuild } from 'esbuild';

import { tsConfigPathsPlugin } from './esbuild-plugin';

/**
 * Mirrors the repository topology that {@link tsConfigPathsPlugin} has to support:
 *
 * ```
 * <root>/tsconfig.base.json          <- declares `paths`, no `baseUrl`
 * <root>/packages/pkg/tsconfig.json  <- extends the base config
 * <root>/packages/pkg/dist/ssr-tests <- esbuild `cwd`, several levels below the config
 * <root>/packages/dep/src/index.ts   <- alias target, outside the child config directory
 * ```
 */
function prepareFixture(
  overrides: {
    baseConfig?: Record<string, unknown>;
    packageConfig?: Record<string, unknown>;
  } = {},
) {
  const fixturesRootDir = join(__dirname, '__fixtures__', 'esbuild-plugin');
  mkdirSync(fixturesRootDir, { recursive: true });

  const root = mkdtempSync(join(fixturesRootDir, 'workspace-'));
  const packageRoot = join(root, 'packages', 'pkg');
  const distDirectory = join(packageRoot, 'dist', 'ssr-tests');
  const dependencyRoot = join(root, 'packages', 'dep');

  mkdirSync(distDirectory, { recursive: true });
  mkdirSync(join(dependencyRoot, 'src'), { recursive: true });

  writeFileSync(join(dependencyRoot, 'src', 'index.ts'), 'export const dep = 1;', 'utf-8');

  writeFileSync(
    join(root, 'tsconfig.base.json'),
    JSON.stringify(
      overrides.baseConfig ?? {
        compilerOptions: {
          target: 'ES2019',
          module: 'esnext',
          moduleResolution: 'bundler',
          paths: {
            '@proj/dep': ['./packages/dep/src/index.ts'],
          },
        },
      },
      null,
      2,
    ),
    'utf-8',
  );

  writeFileSync(
    join(packageRoot, 'tsconfig.json'),
    JSON.stringify(
      overrides.packageConfig ?? {
        extends: '../../tsconfig.base.json',
        compilerOptions: { noEmit: true },
        include: [],
        files: [],
      },
      null,
      2,
    ),
    'utf-8',
  );

  return {
    cleanup: () => rmSync(fixturesRootDir, { recursive: true, force: true }),
    paths: { root, packageRoot, distDirectory, dependencyRoot },
  };
}

/**
 * Runs a plugin's `setup` and returns the registered `onResolve` callback.
 */
function getResolver(plugin: Plugin) {
  let resolver: ((args: OnResolveArgs) => OnResolveResult | null) | undefined;

  const onResolve: PluginBuild['onResolve'] = (_options, callback) => {
    resolver = callback as (args: OnResolveArgs) => OnResolveResult | null;
  };

  plugin.setup({ onResolve } as unknown as PluginBuild);

  if (!resolver) {
    throw new Error('plugin did not register an onResolve callback');
  }

  return (importPath: string) => resolver!({ path: importPath } as OnResolveArgs);
}

describe('tsConfigPathsPlugin', () => {
  let fixture: ReturnType<typeof prepareFixture> | undefined;

  afterEach(() => {
    fixture?.cleanup();
    fixture = undefined;
  });

  it('resolves aliases declared in an extended base config that has no baseUrl', () => {
    fixture = prepareFixture();

    const resolve = getResolver(tsConfigPathsPlugin({ cwd: fixture.paths.distDirectory }));

    expect(resolve('@proj/dep')).toEqual({
      path: join(fixture.paths.dependencyRoot, 'src', 'index.ts'),
    });
  });

  it('ignores specifiers that are not path aliases', () => {
    fixture = prepareFixture();

    const resolve = getResolver(tsConfigPathsPlugin({ cwd: fixture.paths.distDirectory }));

    expect(resolve('react')).toBeNull();
    expect(resolve('./relative')).toBeNull();
  });

  it('resolves aliases against baseUrl when the config still declares one', () => {
    fixture = prepareFixture({
      baseConfig: {
        compilerOptions: {
          paths: {
            '@proj/dep': ['./dep/src/index.ts'],
          },
        },
      },
      packageConfig: {
        extends: '../../tsconfig.base.json',
        compilerOptions: { baseUrl: '..' },
        include: [],
        files: [],
      },
    });

    const resolve = getResolver(tsConfigPathsPlugin({ cwd: fixture.paths.distDirectory }));

    expect(resolve('@proj/dep')).toEqual({
      path: join(fixture.paths.dependencyRoot, 'src', 'index.ts'),
    });
  });

  it('throws when a path alias maps to multiple targets', () => {
    fixture = prepareFixture({
      baseConfig: {
        compilerOptions: {
          paths: {
            '@proj/dep': ['./packages/dep/src/index.ts', './packages/dep/src/other.ts'],
          },
        },
      },
    });

    const distDirectory = fixture.paths.distDirectory;

    expect(() => tsConfigPathsPlugin({ cwd: distDirectory })).toThrow(/Multiple TS path mappings are not supported/);
  });

  it('throws with formatted diagnostics when the config extends a missing file', () => {
    fixture = prepareFixture({
      packageConfig: {
        extends: '../../tsconfig.does-not-exist.json',
        include: [],
        files: [],
      },
    });

    const distDirectory = fixture.paths.distDirectory;

    expect(() => tsConfigPathsPlugin({ cwd: distDirectory })).toThrow(/Failed to parse/);
    expect(() => tsConfigPathsPlugin({ cwd: distDirectory })).toThrow(
      /error TS5083: Cannot read file .*tsconfig\.does-not-exist\.json/,
    );
  });

  it('throws with formatted diagnostics when the config declares an unknown compiler option', () => {
    fixture = prepareFixture({
      packageConfig: {
        extends: '../../tsconfig.base.json',
        compilerOptions: { noEmit: true, thisOptionDoesNotExist: true },
        include: [],
        files: [],
      },
    });

    const distDirectory = fixture.paths.distDirectory;

    expect(() => tsConfigPathsPlugin({ cwd: distDirectory })).toThrow(/Failed to parse/);
    expect(() => tsConfigPathsPlugin({ cwd: distDirectory })).toThrow(/thisOptionDoesNotExist/);
  });

  it('throws with formatted diagnostics when a compiler option has an invalid value', () => {
    fixture = prepareFixture({
      packageConfig: {
        extends: '../../tsconfig.base.json',
        compilerOptions: { moduleResolution: 'not-a-resolution-mode' },
        include: [],
        files: [],
      },
    });

    const distDirectory = fixture.paths.distDirectory;

    expect(() => tsConfigPathsPlugin({ cwd: distDirectory })).toThrow(/Failed to parse/);
    expect(() => tsConfigPathsPlugin({ cwd: distDirectory })).toThrow(/moduleResolution/);
  });
});
