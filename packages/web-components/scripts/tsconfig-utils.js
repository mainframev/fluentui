// @ts-check

/**
 * This script should be shared for all web-component packages.
 * Tracking issue - https://github.com/microsoft/fluentui/issues/33576
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Creates a transient tsconfig, next to `tsConfigPath`, which turns TS path aliases off
 * (`"paths": null`) for a single `tsc` invocation and returns its path.
 *
 * TypeScript 6 deprecates `baseUrl`, which used to be (ab)used as `tsc --baseUrl .` to make the
 * workspace root relative `paths` entries unresolvable. TypeScript 6 resolves `paths` relative to
 * the config file that declares them, so nulling `paths` is now the only supported way to opt a
 * compilation out of path aliases - and it cannot be expressed via CLI flags, only via a config file.
 *
 * @param {string} tsConfigPath
 * @param {string} purpose
 */
export function createTsConfigWithoutPathAliases(tsConfigPath, purpose) {
  const configFileName = path.basename(tsConfigPath);
  const generatedPath = path.join(
    path.dirname(tsConfigPath),
    `tsconfig.__generated-no-path-aliases-${purpose}-${configFileName}`,
  );

  fs.writeFileSync(
    generatedPath,
    JSON.stringify({ extends: `./${configFileName}`, compilerOptions: { paths: null } }, null, 2),
    'utf-8',
  );

  const cleanup = () => {
    if (fs.existsSync(generatedPath)) {
      fs.rmSync(generatedPath, { force: true });
    }
  };

  process.once('exit', cleanup);

  return { path: generatedPath, cleanup };
}
