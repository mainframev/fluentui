import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import * as os from 'node:os';
import { join } from 'node:path';

import type { OnResolveArgs, OnResolveResult, Plugin, PluginBuild } from 'esbuild';
import * as ts from 'typescript';

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
  // written under the OS temp directory (never inside a source tree) so an interrupted run cannot leave
  // fixture files behind for git/tsconfig to pick up
  const root = mkdtempSync(join(os.tmpdir(), 'esbuild-plugin-workspace-'));
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
    cleanup: () => rmSync(root, { recursive: true, force: true }),
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

/**
 * `ts.getParsedCommandLineOfConfigFile(...).errors` is misleadingly named: TypeScript can also place
 * `Warning`/`Suggestion` category diagnostics in that array, which must not fail path alias resolution -
 * only genuine `Error` category diagnostics may. `typescript`'s own exports are frozen, so the function is
 * wrapped in a `jest.fn()` (rather than `jest.spyOn`, which cannot redefine a non-configurable property).
 */
jest.mock('typescript', () => {
  const actual = jest.requireActual<typeof ts>('typescript');
  return { ...actual, getParsedCommandLineOfConfigFile: jest.fn(actual.getParsedCommandLineOfConfigFile) };
});

describe('tsConfigPathsPlugin - non-error config diagnostics', () => {
  let fixture: ReturnType<typeof prepareFixture> | undefined;
  const getParsedCommandLineOfConfigFileMockFn = ts.getParsedCommandLineOfConfigFile as jest.MockedFunction<
    typeof ts.getParsedCommandLineOfConfigFile
  >;
  const actualGetParsedCommandLineOfConfigFile =
    jest.requireActual<typeof ts>('typescript').getParsedCommandLineOfConfigFile;

  afterEach(() => {
    fixture?.cleanup();
    fixture = undefined;
    getParsedCommandLineOfConfigFileMockFn.mockImplementation(actualGetParsedCommandLineOfConfigFile);
  });

  function createDiagnostic(category: ts.DiagnosticCategory, messageText: string): ts.Diagnostic {
    return {
      category,
      code: 9999,
      file: undefined,
      start: undefined,
      length: undefined,
      messageText,
    };
  }

  /**
   * Parses the real fixture config, then swaps in a synthetic `errors` array so the diagnostic category
   * filtering can be exercised directly, without depending on a real world config that happens to produce
   * a non-error diagnostic (none of the fixtures above do).
   */
  function stubParsedConfigErrors(errors: ts.Diagnostic[]) {
    getParsedCommandLineOfConfigFileMockFn.mockImplementation((...args) => {
      const parsedConfig = actualGetParsedCommandLineOfConfigFile(...args);
      return parsedConfig && { ...parsedConfig, errors };
    });
  }

  it('does not throw when only a warning/suggestion category diagnostic is reported', () => {
    fixture = prepareFixture();
    stubParsedConfigErrors([
      createDiagnostic(ts.DiagnosticCategory.Warning, 'a harmless warning'),
      createDiagnostic(ts.DiagnosticCategory.Suggestion, 'a helpful suggestion'),
    ]);

    expect(() => tsConfigPathsPlugin({ cwd: fixture!.paths.distDirectory })).not.toThrow();
  });

  it('still throws for a real error even when a warning/suggestion diagnostic is also present', () => {
    fixture = prepareFixture();
    stubParsedConfigErrors([
      createDiagnostic(ts.DiagnosticCategory.Warning, 'a harmless warning'),
      createDiagnostic(ts.DiagnosticCategory.Error, 'a real configuration error'),
    ]);

    expect(() => tsConfigPathsPlugin({ cwd: fixture!.paths.distDirectory })).toThrow(/a real configuration error/);
  });
});
