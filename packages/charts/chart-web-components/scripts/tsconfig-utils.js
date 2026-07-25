// @ts-check

/**
 * This script should be shared for all web-component packages.
 * Tracking issue - https://github.com/microsoft/fluentui/issues/33576
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * All transient configs created by this module which have not been cleaned up yet.
 *
 * Registering them in one place keeps the number of process listeners constant - one listener per
 * module - no matter how many `tsc` invocations a script performs.
 *
 * NOTE: behaviourally aligned with `scripts/tasks/src/utils.ts#createTsConfigWithoutPathAliases`.
 * The duplication is intentional - web-components packages must not depend on the `just` based
 * v8 build tooling.
 *
 * @type {Set<string>}
 */
const pendingTransientTsConfigs = new Set();
let transientTsConfigsCounter = 0;
let processListenersRegistered = false;

/**
 * @param {string} generatedPath
 */
function removeTransientTsConfig(generatedPath) {
  pendingTransientTsConfigs.delete(generatedPath);
  fs.rmSync(generatedPath, { force: true });
}

function cleanupTransientTsConfigs() {
  for (const generatedPath of [...pendingTransientTsConfigs]) {
    removeTransientTsConfig(generatedPath);
  }
}

function registerProcessListeners() {
  if (processListenersRegistered) {
    return;
  }

  processListenersRegistered = true;

  process.on('exit', cleanupTransientTsConfigs);

  // node does not run `exit` listeners when a process is terminated by a signal,
  // so clean up explicitly and re-raise to keep the default termination semantics
  for (const signal of /** @type {const} */ (['SIGINT', 'SIGTERM'])) {
    process.once(signal, cleanupTransientTsConfigsOnSignal);
  }
}

/**
 * @param {NodeJS.Signals} signal
 */
function cleanupTransientTsConfigsOnSignal(signal) {
  cleanupTransientTsConfigs();
  process.kill(process.pid, signal);
}

/**
 * Creates a transient tsconfig, next to `tsConfigPath`, which turns TS path aliases off
 * (`"paths": null`) for a single `tsc` invocation and returns its path.
 *
 * TypeScript 6 deprecates `baseUrl`, which used to be (ab)used as `tsc --baseUrl .` to make the
 * workspace root relative `paths` entries unresolvable. TypeScript 6 resolves `paths` relative to
 * the config file that declares them, so nulling `paths` is now the only supported way to opt a
 * compilation out of path aliases - and it cannot be expressed via CLI flags, only via a config file.
 *
 * NOTES:
 * - the generated config lives next to the original one, so every relative path
 *   (`extends`/`include`/`outDir`/`rootDir`/`references`) keeps resolving identically
 * - the file name is unique per process and invocation, so the concurrent `tsc` runs these
 *   scripts spawn can never delete each other's config
 *
 * @param {string} tsConfigPath
 * @param {string} purpose
 */
export function createTsConfigWithoutPathAliases(tsConfigPath, purpose) {
  if (!fs.existsSync(tsConfigPath)) {
    throw new Error(`Cannot disable TS path aliases for "${tsConfigPath}", because the file doesn't exist.`);
  }

  const configFileName = path.basename(tsConfigPath);
  const uniqueId = `${process.pid}-${transientTsConfigsCounter++}-${crypto.randomBytes(4).toString('hex')}`;
  const generatedPath = path.join(
    path.dirname(tsConfigPath),
    `tsconfig.__generated-no-path-aliases-${purpose}-${uniqueId}-${configFileName}`,
  );

  fs.writeFileSync(
    generatedPath,
    JSON.stringify({ extends: `./${configFileName}`, compilerOptions: { paths: null } }, null, 2),
    'utf-8',
  );

  pendingTransientTsConfigs.add(generatedPath);
  registerProcessListeners();

  return { path: generatedPath, cleanup: () => removeTransientTsConfig(generatedPath) };
}
