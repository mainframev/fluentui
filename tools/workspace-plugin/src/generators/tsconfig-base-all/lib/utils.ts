// use this module to define any kind of generic utilities that are used in more than 1 place within the generator implementation
import path from 'path';
import { readJson, Tree } from '@nx/devkit';

/**
 *
 * Create tsconfig.json with merged "compilerOptions.paths" from v0,v8,v9 tsconfigs.
 */
export function createPathAliasesConfig(tree: Tree) {
  const tsConfigAllPath = '/tsconfig.base.all.json';
  const existingTsConfig = tree.exists(tsConfigAllPath) ? readJson(tree, tsConfigAllPath) : null;

  const baseConfigs = {
    v8: readJson(tree, path.join('/tsconfig.base.v8.json')),
    v9: readJson(tree, path.join('/tsconfig.base.json')),
  };
  const tsConfigBase = '.';
  const mergedTsConfig = {
    compilerOptions: {
      moduleResolution: 'bundler',
      skipLibCheck: true,
      typeRoots: ['node_modules/@types', './typings'],
      isolatedModules: true,
      preserveConstEnums: true,
      sourceMap: true,
      pretty: true,
      rootDir: tsConfigBase,
      // NOTE: no `baseUrl` - TypeScript 6+ resolves `paths` relative to this config file's
      // directory, so every entry in `paths` (merged from the v8/v9 base configs below) must
      // already be an explicitly relative path (e.g. prefixed with `./`).
      paths: {
        ...baseConfigs.v8.compilerOptions.paths,
        ...baseConfigs.v9.compilerOptions.paths,
      },
    },
  };

  return { tsConfigAllPath, mergedTsConfig, existingTsConfig };
}
