import * as path from 'node:path';

import type { Plugin } from 'esbuild';
import * as ts from 'typescript';

const diagnosticsHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: fileName => fileName,
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  getNewLine: () => ts.sys.newLine,
};

function assertPathAliasesSetup(paths: Record<string, string[]>): never | void {
  for (const [key, mapping] of Object.entries(paths)) {
    if (mapping.length > 1) {
      throw new Error(
        `Multiple TS path mappings are not supported. Please adjust your config. "${key}": [ ${mapping.join()} ]"`,
      );
    }
  }
}

function createConfigParseError(configFilePath: string, diagnostics: readonly ts.Diagnostic[]): Error {
  return new Error(
    [
      `Failed to parse "${configFilePath}".`,
      ``,
      ts.formatDiagnostics(diagnostics, diagnosticsHost).trimEnd(),
      ``,
      `Path aliases cannot be resolved from a config that does not parse - fix the config above.`,
    ].join('\n'),
  );
}

/**
 * Resolves `compilerOptions.paths` and the directory they have to be resolved against.
 *
 * Since TypeScript 6 `baseUrl` is deprecated, so `compilerOptions.paths` entries are resolved relative to
 * the config file that declares them. TypeScript exposes that directory on the parsed options as the
 * internal `pathsBasePath` and resolves mappings against `baseUrl ?? pathsBasePath`
 * (see `getPathsBasePath` in the TypeScript module resolver), which is mirrored here.
 *
 * Parse diagnostics are fatal: silently continuing would fall back to `node_modules` resolution and
 * produce a bundle built against published packages instead of workspace sources.
 */
function loadPathAliases(cwd: string) {
  const configFilePath = ts.findConfigFile(cwd, ts.sys.fileExists);

  if (!configFilePath) {
    throw new Error(`No tsconfig.json found for "${cwd}"`);
  }

  const parsedConfig = ts.getParsedCommandLineOfConfigFile(configFilePath, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw createConfigParseError(configFilePath, [diagnostic]);
    },
  } as ts.ParseConfigFileHost);

  if (!parsedConfig) {
    throw new Error(`Unable to parse "${configFilePath}"`);
  }

  if (parsedConfig.errors.length > 0) {
    throw createConfigParseError(configFilePath, parsedConfig.errors);
  }

  const options = parsedConfig.options as ts.CompilerOptions & { pathsBasePath?: string };
  const paths = (options.paths ?? {}) as Record<string, string[]>;
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- `baseUrl` is deprecated but still honoured by TS, and configs in the wild may still set it
  const pathAliasesBasePath = options.baseUrl ?? options.pathsBasePath;

  if (Object.keys(paths).length > 0 && !pathAliasesBasePath) {
    throw new Error(
      [
        `"compilerOptions.paths" declared in "${configFilePath}" cannot be resolved.`,
        `TypeScript resolves path mappings against "baseUrl" or, since TypeScript 6, against the directory of the config file that declares them.`,
        `Neither is available for this config.`,
      ].join('\n'),
    );
  }

  return {
    paths,
    pathAliasesBasePath: pathAliasesBasePath ?? path.dirname(configFilePath),
  };
}

export function tsConfigPathsPlugin(options: { cwd: string }): Plugin {
  const { paths: pathAliases, pathAliasesBasePath } = loadPathAliases(options.cwd);

  assertPathAliasesSetup(pathAliases);

  const pluginConfig: Plugin = {
    name: 'tsconfig-paths',
    setup({ onResolve }) {
      onResolve({ filter: /.*/ }, args => {
        const pathMapping = pathAliases[args.path];

        if (!pathMapping) {
          return null;
        }

        const absoluteImportPath = path.resolve(pathAliasesBasePath, pathMapping[0]);

        return { path: absoluteImportPath };
      });
    },
  };

  return pluginConfig;
}

/**
 * SSR shim for `*.module.css` imports. Returns a Proxy that echoes the requested
 * property name (so `styles.foo === 'foo'`), which keeps className strings stable
 * for SSR rendering without needing the actual CSS-Modules transform.
 */
export function cssModulesShimPlugin(): Plugin {
  return {
    name: 'css-modules-shim',
    setup({ onResolve, onLoad }) {
      onResolve({ filter: /\.module\.css$/ }, args => {
        const absolute = path.isAbsolute(args.path) ? args.path : path.resolve(args.resolveDir, args.path);
        return { path: absolute, namespace: 'css-modules-shim' };
      });
      onLoad({ filter: /.*/, namespace: 'css-modules-shim' }, () => ({
        contents: [
          `const styles = new Proxy({}, { get: (_, key) => typeof key === 'string' ? key : '' });`,
          `export default styles;`,
        ].join('\n'),
        loader: 'js',
      }));
    },
  };
}
