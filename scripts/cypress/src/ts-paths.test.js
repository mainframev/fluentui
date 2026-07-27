// @ts-check

const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const { join } = require('node:path');

/**
 * `parseJsonConfigFileContent(...).errors` is misleadingly named: TypeScript can also place
 * `Warning`/`Suggestion` category diagnostics in that array, which must not fail path alias resolution -
 * only genuine `Error` category diagnostics may. `typescript`'s own exports are frozen, so the module is
 * wrapped in a `jest.fn()` (rather than `jest.spyOn`, which cannot redefine a non-configurable property).
 *
 * NOTE: this file is plain CommonJS (see `./ts-paths` and `./base.config` for why), so - unlike a
 * TypeScript test transformed by `ts-jest`/`@swc/jest` - `jest.mock` calls are *not* hoisted above
 * `require` calls by babel. `jest.mock('typescript', ...)` therefore has to be the first thing in this
 * file, textually before `./ts-paths` (and anything else) requires `typescript`, or the module under
 * test would keep the real, un-mocked module instance.
 */
jest.mock('typescript', () => {
  const actual = jest.requireActual('typescript');
  return { ...actual, parseJsonConfigFileContent: jest.fn(actual.parseJsonConfigFileContent) };
});

const ts = require('typescript');

const { readWorkspacePathAliases } = require('./ts-paths');

/**
 * Mirrors the repository topology that {@link readWorkspacePathAliases} has to support:
 *
 * ```
 * <root>/tsconfig.base.json          <- declares `paths`, no `baseUrl`
 * <root>/packages/pkg/tsconfig.json  <- extends the base config
 * <root>/packages/dep/src/index.ts   <- alias target, outside the child config directory
 * ```
 *
 * @param {{ baseConfig?: Record<string, unknown>; packageConfig?: Record<string, unknown> }} [overrides]
 */
function prepareFixture(overrides = {}) {
  // written under the OS temp directory (never inside a source tree) so an interrupted run cannot leave
  // fixture files behind for git/tsconfig to pick up
  const root = mkdtempSync(join(os.tmpdir(), 'ts-paths-workspace-'));
  const packageRoot = join(root, 'packages', 'pkg');
  const dependencyRoot = join(root, 'packages', 'dep');

  mkdirSync(packageRoot, { recursive: true });
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
    paths: { root, packageRoot, dependencyRoot, tsConfigPath: join(packageRoot, 'tsconfig.json') },
  };
}

describe('readWorkspacePathAliases', () => {
  /** @type {ReturnType<typeof prepareFixture> | undefined} */
  let fixture;

  afterEach(() => {
    fixture?.cleanup();
    fixture = undefined;
  });

  it('resolves the base directory of paths declared in an extended base config that has no baseUrl', () => {
    fixture = prepareFixture();

    const result = readWorkspacePathAliases(fixture.paths.tsConfigPath);

    expect(result).toEqual({ absoluteBaseUrl: fixture.paths.root });
  });

  it('does not enumerate the workspace to resolve the base directory', () => {
    // `readDirectory` backs `include`/`exclude`/`files` glob expansion, which this module never reads -
    // a real filesystem walk here would be both wasted work and a footgun for monorepo-wide configs.
    fixture = prepareFixture({
      packageConfig: {
        extends: '../../tsconfig.base.json',
        compilerOptions: { noEmit: true },
        // deliberately omit `include`/`files` so a real `readDirectory` would enumerate the fixture root
      },
    });

    const result = readWorkspacePathAliases(fixture.paths.tsConfigPath);

    expect(result).toEqual({ absoluteBaseUrl: fixture.paths.root });
  });

  it('throws with formatted diagnostics when the config extends a missing file', () => {
    fixture = prepareFixture({
      packageConfig: {
        extends: '../../tsconfig.does-not-exist.json',
        include: [],
        files: [],
      },
    });
    const { tsConfigPath } = fixture.paths;

    expect(() => readWorkspacePathAliases(tsConfigPath)).toThrow(/Failed to parse/);
    expect(() => readWorkspacePathAliases(tsConfigPath)).toThrow(
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
    const { tsConfigPath } = fixture.paths;

    expect(() => readWorkspacePathAliases(tsConfigPath)).toThrow(/Failed to parse/);
    expect(() => readWorkspacePathAliases(tsConfigPath)).toThrow(/thisOptionDoesNotExist/);
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
    const { tsConfigPath } = fixture.paths;

    expect(() => readWorkspacePathAliases(tsConfigPath)).toThrow(/Failed to parse/);
    expect(() => readWorkspacePathAliases(tsConfigPath)).toThrow(/moduleResolution/);
  });

  it('throws with formatted diagnostics when the tsconfig itself cannot be read', () => {
    fixture = prepareFixture();
    const missingConfigPath = join(fixture.paths.packageRoot, 'does-not-exist.json');

    expect(() => readWorkspacePathAliases(missingConfigPath)).toThrow(/Failed to parse/);
  });
});

describe('readWorkspacePathAliases - non-error config diagnostics', () => {
  /** @type {ReturnType<typeof prepareFixture> | undefined} */
  let fixture;
  const parseJsonConfigFileContentMockFn = /** @type {jest.MockedFunction<typeof ts.parseJsonConfigFileContent>} */ (
    ts.parseJsonConfigFileContent
  );
  const actualParseJsonConfigFileContent = jest.requireActual('typescript').parseJsonConfigFileContent;

  afterEach(() => {
    fixture?.cleanup();
    fixture = undefined;
    parseJsonConfigFileContentMockFn.mockImplementation(actualParseJsonConfigFileContent);
  });

  /**
   * @param {import('typescript').DiagnosticCategory} category
   * @param {string} messageText
   * @returns {import('typescript').Diagnostic}
   */
  function createDiagnostic(category, messageText) {
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
   *
   * @param {import('typescript').Diagnostic[]} errors
   */
  function stubParsedConfigErrors(errors) {
    parseJsonConfigFileContentMockFn.mockImplementation((...args) => {
      const parsedConfig = actualParseJsonConfigFileContent(...args);
      return { ...parsedConfig, errors };
    });
  }

  it('does not throw when only a warning/suggestion category diagnostic is reported', () => {
    fixture = prepareFixture();
    const { tsConfigPath } = fixture.paths;
    stubParsedConfigErrors([
      createDiagnostic(ts.DiagnosticCategory.Warning, 'a harmless warning'),
      createDiagnostic(ts.DiagnosticCategory.Suggestion, 'a helpful suggestion'),
    ]);

    expect(() => readWorkspacePathAliases(tsConfigPath)).not.toThrow();
  });

  it('still throws for a real error even when a warning/suggestion diagnostic is also present', () => {
    fixture = prepareFixture();
    const { tsConfigPath } = fixture.paths;
    stubParsedConfigErrors([
      createDiagnostic(ts.DiagnosticCategory.Warning, 'a harmless warning'),
      createDiagnostic(ts.DiagnosticCategory.Error, 'a real configuration error'),
    ]);

    expect(() => readWorkspacePathAliases(tsConfigPath)).toThrow(/a real configuration error/);
  });
});
