import * as fs from 'fs';
import * as path from 'path';

import type { ExtractorMessageCategory, ExtractorResult } from '@microsoft/api-extractor';
import { workspaceRoot } from '@nx/devkit';
import chalk from 'chalk';
import { isCI } from 'ci-info';
import * as glob from 'glob';
import { ApiExtractorOptions, TaskFunction, apiExtractorVerifyTask, logger, series, task } from 'just-scripts';
import type * as ApiExtractorTypes from 'just-scripts/src/tasks/apiExtractorTypes';

import { getJustArgv } from './argv';
import { getTsPathAliasesApiExtractorConfig, getTsPathAliasesConfig } from './utils';

const compilerMessages = {
  /**
   * Module has no exported member '<identifier-name>'.
   * This error is thrown when package uses other package `@internal` API's that are removed
   */
  TS2305: 'TS2305',
  /**
   * Could not find a declaration file for module
   * This error is thrown when package depends on package that is missing rollup .d.ts (needs to be generated)
   */
  TS7016: 'TS7016',
};

/**
 * Utility to convert enums (which lack proper strict dictionary checking) to strict dictionary
 *
 * This is mainly needed because api-extractor ships everything as typescript enums
 */
type CreateStrictDictionary<T extends Record<string, string>> = { [K in keyof T]: `${T[K]}` };

const messageCategories: CreateStrictDictionary<typeof ExtractorMessageCategory> = {
  Compiler: 'Compiler',
  Console: 'console',
  Extractor: 'Extractor',
  TSDoc: 'TSDoc',
};

/**
 * Finds module specifiers that a `.d.ts` rollup must never contain.
 *
 * A rollup is published as a single self contained file, so every relative specifier within it points to a
 * module that does not exist for consumers.
 *
 * This happens when TypeScript declaration output references a type through an inline `import('./module')`
 * type: API Extractor resolves such references as external packages whenever a modern `moduleResolution`
 * (`bundler`, `node16`, `nodenext`) is used, instead of inlining the referenced declaration.
 * The fix belongs in the source file - annotate the exported value with a type that is imported statically.
 *
 * @see https://github.com/microsoft/rushstack/issues/3335
 */
export function findRelativeImportsInDtsRollup(rollupContents: string): string[] {
  const relativeModuleSpecifier = /^\s*(?:import|export)\b[^;'"]*?(?:from\s+)?['"](\.[^'"]*)['"]/gm;
  const specifiers = new Set<string>();

  for (const [, specifier] of rollupContents.matchAll(relativeModuleSpecifier)) {
    specifiers.add(specifier);
  }

  return [...specifiers];
}

/**
 * @see https://api-extractor.com/pages/commands/api-extractor_run/
 */
interface ApiExtractorCliRunCommandArgs {
  config: string;
  diagnostics: boolean;
  local: boolean;
  verbose: boolean;
  'typescript-compiler-folder': string;
}

export function apiExtractor(): TaskFunction {
  const { configs, configsToExecute } = getConfig();
  const messages: Record<keyof typeof compilerMessages, string[]> = {
    TS7016: [] as string[],
    TS2305: [] as string[],
  };

  const args: ReturnType<typeof getJustArgv> & Partial<ApiExtractorCliRunCommandArgs> = getJustArgv();
  const { isUsingTsSolutionConfigs, packageJson, tsConfigs } = getTsPathAliasesConfig();

  if (configsToExecute.length === 0) {
    return task('api-extractor-noop', noop);
  }

  /**
   * overrides api-extractor default `true` to be `false` on local dev machine
   * Triggers if path aliases will be used or yarn workspaces (that needs to be build based on package dependency tree)
   */
  const isLocalBuild = Boolean((args.local || process.env.__FORCE_API_MD_UPDATE__) ?? !(process.env.TF_BUILD || isCI));

  const tasks = configsToExecute.map(([configPath, configName]) => {
    const taskName = `api-extractor:${configName}`;

    task(
      taskName,

      apiExtractorVerifyTask({
        showVerboseMessages: args.verbose,
        showDiagnostics: args.diagnostics,
        typescriptCompilerFolder: args['typescript-compiler-folder'],
        configJsonFilePath: args.config ?? configPath,
        localBuild: isLocalBuild,
        onConfigLoaded,
        messageCallback,
        onResult,
      }),
    );

    return taskName;
  });

  return series(...tasks);

  function noop() {
    if (configs.length) {
      logger.info(`skipping api-extractor execution - no configs to execute present besides: '${configs}'`);
      return;
    }

    logger.info(`skipping api-extractor execution - no configs present`);
  }

  function onConfigLoaded(config: Parameters<NonNullable<ApiExtractorOptions['onConfigLoaded']>>[0]) {
    if (!(isUsingTsSolutionConfigs && tsConfigs.lib)) {
      return;
    }

    logger.info(`api-extractor: package is using TS path aliases. Overriding TS compiler settings.`);

    const compilerConfig = getTsPathAliasesApiExtractorConfig({
      tsConfig: tsConfigs.lib,
      packageJson,
      pathAliasesTsConfigPath: isLocalBuild ? path.join(workspaceRoot, 'tsconfig.base.json') : undefined,
      definitionsRootPath: 'dist/out-tsc/types',
    });

    // NOTE: internally just-tasks calls `options.onConfigLoaded?.(rawConfig);` so we need to mutate object properties (js passes objects by reference)
    config.compiler = compilerConfig;
  }

  function messageCallback(message: Parameters<NonNullable<ApiExtractorOptions['messageCallback']>>[0]) {
    if (!isUsingTsSolutionConfigs) {
      return;
    }
    if (message.category !== messageCategories.Compiler) {
      return;
    }

    if (message.messageId === compilerMessages.TS2305) {
      messages.TS2305.push(message.text);
    }

    if (message.messageId === compilerMessages.TS7016) {
      messages.TS7016.push(message.text);
    }
  }

  function onResult(result: ExtractorResult, _extractorOptions: ApiExtractorTypes.IExtractorInvokeOptions): void {
    assertSelfContainedDtsRollup(result);

    if (!isUsingTsSolutionConfigs) {
      return;
    }

    if (result.succeeded === true) {
      return;
    }

    if (messages.TS7016.length) {
      const errTitle = [
        chalk.bgRed.white.bold(`api-extractor | MISSING DEPENDENCY TYPE DECLARATIONS:`),
        chalk.red(`  Package dependencies are missing index.d.ts type definitions:`),
        '\n',
      ].join('');
      const logErr = formatMissingApiViolationMessage(messages.TS7016);
      const logFix = chalk.blueBright(
        `${chalk.bold('🛠 FIX')}: run '${chalk.italic(
          `yarn nx run ${packageJson.name.replace('@fluentui/', '')}:generate-api`,
        )}'`,
      );

      logger.error(errTitle, logErr, '\n', logFix, '\n');
    }
  }
}

function assertSelfContainedDtsRollup(result: ExtractorResult): void {
  const { rollupEnabled, untrimmedFilePath, projectFolder } = result.extractorConfig;

  if (!rollupEnabled || !untrimmedFilePath || !fs.existsSync(untrimmedFilePath)) {
    return;
  }

  const relativeImports = findRelativeImportsInDtsRollup(fs.readFileSync(untrimmedFilePath, 'utf-8'));

  if (relativeImports.length === 0) {
    return;
  }

  throw new Error(
    [
      `api-extractor | BROKEN TYPE DECLARATION ROLLUP:`,
      `  ${path.relative(workspaceRoot, untrimmedFilePath)} imports modules that are not published:`,
      ...relativeImports.map(specifier => `    - ${specifier}`),
      ``,
      `  This happens when declaration output references a type through an inline \`import('./module')\` type.`,
      `  🛠 FIX: annotate the affected export in ${path.relative(
        workspaceRoot,
        projectFolder,
      )} with a statically imported type.`,
    ].join('\n'),
  );
}

function getConfig() {
  type Config = [
    configPath: string,
    /**
     * config name is created from <configName> suffix `api-extractor.<configName>.json`.
     * @example
     * `api-extractor.fast.json -> configName === fast`
     *
     * default behavior:
     * `api-extractor.json -> configName === default`
     */
    configName: string,
  ];

  const configs: Config[] = glob
    .sync(path.join(process.cwd(), 'config/api-extractor*.json'))
    .map(configPath => [configPath, configPath.replace(/.*\bapi-extractor(?:\.(.*))?\.json$/, '$1') || 'default']);

  const configsToExecute = configs.filter(([, configName]) => configName !== 'local');

  return { configsToExecute, configs };
}

/**
 *
 * @example
 ```
 (TS7016) Could not find a declaration file for module '@fluentui/react-theme'
 (TS7016) Could not find a declaration file for module '@fluentui/react-shared-contexts'

 ↓ ↓ ↓

 - @fluentui/react-theme
 - @fluentui/react-shared-contexts
 ```
 */
function formatMissingApiViolationMessage(messages: string[]) {
  const regexPkg = /'(@fluentui\/[a-z-]+)'/i;

  return Object.values(
    messages.reduce((acc, curr) => {
      const [, packageName] = regexPkg.exec(curr) ?? [];
      acc[curr] = chalk.italic.red('\t- ' + packageName);
      return acc;
    }, {} as Record<string, string>),
  ).join('\n');
}
