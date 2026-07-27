// @ts-check

const path = require('node:path');

const ts = require('typescript');

/**
 * @typedef {Object} WorkspacePathAliases
 * @property {string} absoluteBaseUrl directory every entry of {@link WorkspacePathAliases.paths} is resolved against
 * @property {Record<string, string[]>} paths raw `compilerOptions.paths` of the config
 */

/**
 * Reads the path aliases of a tsconfig with explicit `pathsBasePath` semantics.
 *
 * TypeScript 6 removed `baseUrl` - `paths` are resolved relative to the config file which declares
 * them and the compiler reports that directory as `pathsBasePath`. Tooling which still keys off
 * `baseUrl` silently skips alias resolution for such configs:
 *
 * - `tsconfig-paths`, which Cypress registers for the Node side before it loads the config file,
 *   prints "Missing baseUrl in compilerOptions. tsconfig-paths will be skipped" and does nothing.
 *   That is inconsequential here - every workspace package the Cypress Node process can reference
 *   is resolvable through its Yarn workspace `node_modules` symlink, and the aliases point at
 *   TypeScript sources which Cypress' bundled `ts-node` cannot compile under TypeScript 6 anyway.
 * - `tsconfig-paths-webpack-plugin` (the bundler side, where the aliases _do_ matter) falls back to
 *   the directory of the config file. Handing it the resolved base explicitly keeps that behaviour
 *   intentional instead of accidental.
 *
 * @param {string} tsConfigPath absolute path to the tsconfig declaring the aliases
 * @returns {WorkspacePathAliases}
 */
function readWorkspacePathAliases(tsConfigPath) {
  const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);

  if (error) {
    throw new Error(`Unable to read "${tsConfigPath}": ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}`);
  }

  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(tsConfigPath));
  // `CompilerOptions` widens every non declared option to `CompilerOptionsValue`
  const pathsBasePath = typeof options.pathsBasePath === 'string' ? options.pathsBasePath : undefined;

  return {
    absoluteBaseUrl: pathsBasePath ? path.resolve(pathsBasePath) : path.dirname(tsConfigPath),
    paths: options.paths ?? {},
  };
}

module.exports = { readWorkspacePathAliases };
