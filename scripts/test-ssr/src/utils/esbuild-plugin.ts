import * as path from 'node:path';

import type { Plugin } from 'esbuild';
import * as ts from 'typescript';

function assertPathAliasesSetup(paths: Record<string, string[]>): never | void {
  for (const [key, mapping] of Object.entries(paths)) {
    if (mapping.length > 1) {
      throw new Error(
        `Multiple TS path mappings are not supported. Please adjust your config. "${key}": [ ${mapping.join()} ]"`,
      );
    }
  }
}

/**
 * Since TypeScript 6 `baseUrl` is deprecated, so `compilerOptions.paths` entries are resolved relative to the
 * config file that declares them. TypeScript exposes that directory on the parsed options as `pathsBasePath`.
 */
function loadPathAliases(cwd: string) {
  const configFilePath = ts.findConfigFile(cwd, ts.sys.fileExists);

  if (!configFilePath) {
    throw new Error(`No tsconfig.json found for "${cwd}"`);
  }

  const parsedConfig = ts.getParsedCommandLineOfConfigFile(configFilePath, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  } as ts.ParseConfigFileHost);

  if (!parsedConfig) {
    throw new Error(`Unable to parse "${configFilePath}"`);
  }

  const { paths = {}, pathsBasePath } = parsedConfig.options as ts.CompilerOptions & {
    pathsBasePath?: string;
  };

  return {
    paths: paths as Record<string, string[]>,
    pathAliasesBasePath: pathsBasePath ?? path.dirname(configFilePath),
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
