/**
 * This script should be shared for all web-component packages.
 * Tracking issue - https://github.com/microsoft/fluentui/issues/33576
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

import { createTsConfigWithoutPathAliases } from './tsconfig-utils.js';

main();

function compile() {
  try {
    console.log(chalk.bold(`🎬 compile:start`));

    console.log(chalk.blueBright(`compile: running tsc`));
    const noPathAliasesConfig = createTsConfigWithoutPathAliases('tsconfig.lib.json', 'compile');
    try {
      execSync(`tsc -p ${noPathAliasesConfig.path} --rootDir ./src`, { stdio: 'inherit' });
    } finally {
      noPathAliasesConfig.cleanup();
    }

    console.log(chalk.bold(`🏁 compile:end`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

function main() {
  compile();
}
