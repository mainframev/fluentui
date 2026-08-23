import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

import { createTsConfigWithoutPathAliases } from './utils';

export interface TypeCheckProjectOptions {
  /**
   * tsconfig to type check, relative to `cwd`.
   *
   * @defaultValue 'tsconfig.json'
   */
  project?: string;
  /**
   * @defaultValue process.cwd()
   */
  cwd?: string;
}

/**
 * Type checks a project **without** TS path aliases, so imports resolve to the built declarations
 * of workspace dependencies instead of their sources.
 *
 * This used to be `tsc -p . --noEmit --baseUrl .`: `baseUrl` was overridden to the project folder,
 * which made the workspace root relative `paths` of `tsconfig.base.*.json` unresolvable. TypeScript 6
 * removed `baseUrl` and resolves `paths` relative to the config file declaring them, so the only
 * supported opt out is `"paths": null` - which can be expressed in a config file only, hence this wrapper.
 */
export function typeCheckProject(options: TypeCheckProjectOptions = {}): number {
  const { project = 'tsconfig.json', cwd = process.cwd() } = options;

  const noPathAliasesConfig = createTsConfigWithoutPathAliases(path.resolve(cwd, project), 'type-check');

  try {
    const result = spawnSync(
      process.execPath,
      [require.resolve('typescript/lib/tsc.js'), '-p', noPathAliasesConfig.path, '--pretty', '--noEmit'],
      { cwd, stdio: 'inherit' },
    );

    if (result.error) {
      throw result.error;
    }

    return result.status ?? 1;
  } finally {
    noPathAliasesConfig.cleanup();
  }
}

export function main(argv: string[] = process.argv.slice(2)) {
  const projectFlagIndex = argv.findIndex(arg => arg === '-p' || arg === '--project');

  if (projectFlagIndex !== -1 && argv[projectFlagIndex + 1] === undefined) {
    throw new Error(`"${argv[projectFlagIndex]}" requires a value (eg "-p tsconfig.json")`);
  }

  const project = projectFlagIndex === -1 ? undefined : argv[projectFlagIndex + 1];

  process.exitCode = typeCheckProject({ project });
}
