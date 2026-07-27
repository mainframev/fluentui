// @ts-check

const path = require('node:path');

const ts = require('typescript');

/**
 * @typedef {Object} WorkspacePathAliases
 * @property {string} absoluteBaseUrl directory every entry of {@link WorkspacePathAliases.paths} is resolved against
 * @property {Record<string, string[]>} paths raw `compilerOptions.paths` of the config
 */

/** @type {import('typescript').FormatDiagnosticsHost} */
const diagnosticsHost = {
  getCanonicalFileName: fileName => fileName,
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  getNewLine: () => ts.sys.newLine,
};

/**
 * @param {string} tsConfigPath
 * @param {readonly import('typescript').Diagnostic[]} diagnostics
 */
function createConfigParseError(tsConfigPath, diagnostics) {
  return new Error(
    [
      `Failed to parse "${tsConfigPath}".`,
      ``,
      ts.formatDiagnostics(diagnostics, diagnosticsHost).trimEnd(),
      ``,
      `Path aliases cannot be resolved from a config that does not parse - fix the config above.`,
    ].join('\n'),
  );
}

/**
 * Reads the path aliases of a tsconfig with explicit `pathsBasePath` semantics.
 *
 * TypeScript 6 deprecated `baseUrl` - `paths` entries are resolved against the directory of the config
 * file that *declares* them (which, through an `extends` chain, is not necessarily the config file
 * passed in here) rather than against a project-wide `baseUrl`. TypeScript exposes that directory on
 * the parsed options as `pathsBasePath`, but only computes it when it knows the identity of the config
 * file being parsed - i.e. when `configFileName` is passed to `parseJsonConfigFileContent`. Without it,
 * `pathsBasePath` is left undefined and callers fall back to resolving `paths` against the wrong
 * directory whenever they are declared in a base config.
 *
 * - `tsconfig-paths`, which Cypress registers for the Node side before it loads the config file, does
 *   *not* skip alias resolution just because `baseUrl` is missing (as of `tsconfig-paths@4.2`, it only
 *   gives up when no `tsconfig.json`/`jsconfig.json` can be found at all). For a `baseUrl`-less config
 *   it still resolves `paths`, but anchors them at the directory of the *nearest* config file instead of
 *   the one that declares them - which silently breaks aliases declared in a shared base config such as
 *   this workspace's `tsconfig.base.json`. That is inconsequential here - every workspace package the
 *   Cypress Node process can reference is resolvable through its Yarn workspace `node_modules` symlink,
 *   and the aliases point at TypeScript sources which Cypress' bundled `ts-node` cannot compile under
 *   TypeScript 6 anyway.
 * - `tsconfig-paths-webpack-plugin` (the bundler side, where the aliases _do_ matter) has the same
 *   "nearest config file" fallback. Handing it the `pathsBasePath` resolved here keeps mapping roots
 *   correct through the `extends` chain instead of accidentally correct only when `paths` happen to be
 *   declared in the outermost config.
 *
 * Parse diagnostics are fatal: silently continuing would resolve `paths` from a config that doesn't
 * actually parse (e.g. an invalid `extends` target or an unknown compiler option).
 *
 * @param {string} tsConfigPath absolute path to the tsconfig declaring the aliases
 * @returns {WorkspacePathAliases}
 */
function readWorkspacePathAliases(tsConfigPath) {
  const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);

  if (error) {
    throw createConfigParseError(tsConfigPath, [error]);
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(tsConfigPath),
    /* existingOptions */ undefined,
    // Required for `pathsBasePath` to be computed correctly through `extends` chains - without it
    // TypeScript has no config file identity to resolve `paths`/`pathsBasePath` against.
    tsConfigPath,
  );

  // `parsedConfig.errors` is misleadingly named: TypeScript can also put `Warning`/`Suggestion` category
  // diagnostics in it (e.g. deprecated compiler option notices), which must not fail alias resolution -
  // only genuine `Error` category diagnostics may.
  const configErrors = parsedConfig.errors.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);

  if (configErrors.length > 0) {
    throw createConfigParseError(tsConfigPath, configErrors);
  }

  const { options } = parsedConfig;
  // `CompilerOptions` widens every non declared option to `CompilerOptionsValue`
  const pathsBasePath = typeof options.pathsBasePath === 'string' ? options.pathsBasePath : undefined;

  return {
    absoluteBaseUrl: pathsBasePath ? path.resolve(pathsBasePath) : path.dirname(tsConfigPath),
    paths: options.paths ?? {},
  };
}

module.exports = { readWorkspacePathAliases };
