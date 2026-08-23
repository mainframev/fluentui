import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import yargsParser from 'yargs-parser';
import type * as Enquirer from 'enquirer';
import {
  joinPathFragments,
  logger,
  readProjectConfiguration,
  Tree,
  getProjects as getAllProjects,
  ProjectConfiguration,
  readJson,
  readNxJson,
  NxJsonConfiguration,
} from '@nx/devkit';
import { PackageJson, PackageJsonWithBeachball } from './types';
import semver from 'semver';

const NPM_SCOPE_REGEX = /^@([a-z]+)\/([a-z-]+)/;
/**
 *
 * A tiny abstraction on {@link @nx/devkit#readNxJson} which returns npmScope and asserts that nx.json exists
 */
export function getWorkspaceConfig(tree: Tree): NxJsonConfiguration & { npmScope: string } {
  const nxConfig = readNxJson(tree);
  if (!nxConfig) {
    throw new Error('nx.json doesnt exist at root of monorepo');
  }

  const npmScope = getNpmScope(tree);
  return {
    npmScope,
    ...nxConfig,
  };
}

export function getNpmScope(tree: Tree) {
  const packageJSON = readJson<PackageJson>(tree, '/package.json');
  const matchedName = NPM_SCOPE_REGEX.exec(packageJSON.name);
  if (!matchedName) {
    throw new Error(`root package.json doesn't provide valid monorepo name`);
  }
  if (!matchedName[1]) {
    throw new Error(
      'unable to obtain monorepo npmScope. Please make sure that root package.json#name includes npmScope',
    );
  }

  return matchedName[1];
}

export function getProjectNameWithoutScope(projectName: string) {
  const match = NPM_SCOPE_REGEX.exec(projectName);
  const projectNameIsAlreadyWithoutScope = !match;

  if (projectNameIsAlreadyWithoutScope) {
    return projectName;
  }

  return match[2];
}

/**
 * CLI prompts abstraction to trigger dynamic prompts within a generator
 *
 * @remarks
 * - lazy loads enquirer only when needed making CLI programs faster to load/execute
 *
 * @param questions
 */
export async function prompt<T extends Record<string, unknown>>(questions: Parameters<Enquirer['prompt']>[0]) {
  const EnquirerLazy = await import('enquirer');

  const response = await EnquirerLazy.prompt<T>(questions);

  return response;
}

/**
 * Determine if manual dynamic prompts should be enabled within generator
 *
 * @remarks
 *
 * This should be used if, and only if, you need to setup manual dynamic prompts within your generator.
 *
 * - prompts should be turned off whenever `--no-interactive` is used
 * - turning off prompts is usually what is expected when invoking generator via Nx Console
 * - within tests:
 *   - you should mock `enquirer` accordingly via `jest.mock('enquirer',()=>({ async prompt()=>{} }))`
 *   - then within test suite mock implementation based on your needs:
 *        `const promptSpy = jest.spyOn(Enquirer, 'prompt').mockImplementation(...)`
 *
 * @param [args=process.argv.slice(2)] - command-line arguments passed when the Node.js process was launched (https://nodejs.org/docs/latest/api/process.html#process_process_argv). Default value is `process.argv.slice(2)`
 */
export function arePromptsEnabled(args = process.argv.slice(2)) {
  const parsedArgs = parseArgs(args);
  return parsedArgs.interactive;
}

/**
 *
 * Manual parser of CLI flags which follows similar definition like nx tao. @see https://github.com/nrwl/nx/blob/master/packages/tao/src/commands/generate.ts#L41
 *
 * @remarks
 *
 * This is a low level implementation. What you want to use is {@link arePromptsEnabled}
 *
 * Use this only if you need to setup manual dynamic prompts within your generator.
 * - prompts should be turned off whenever`--no-interactive` is used
 * - turning off prompts is usually what is expected when invoking generator via Nx Console
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseArgs<T extends Record<string, any>>(args: string[]) {
  type ParsedArguments = yargsParser.Arguments &
    T & {
      interactive: boolean;
    };

  const parsedArguments = yargsParser(args, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    boolean: ['interactive'],
    default: {
      interactive: true,
    },
  }) as ParsedArguments;

  return parsedArguments;
}

export { updateJestConfig } from '@nx/workspace/src/generators/move/lib/update-jest-config';

export function getProjectConfig(tree: Tree, options: { packageName: string }) {
  const projectConfig = readProjectConfiguration(tree, options.packageName);
  const workspaceConfig = getWorkspaceConfig(tree);
  const paths = getProjectPaths(projectConfig);

  return {
    projectConfig,
    workspaceConfig,
    /**
     * package name without npmScope (@scopeName)
     */
    normalizedPkgName: options.packageName.replace(`@${workspaceConfig.npmScope}/`, ''),
    paths,
  };
}

export function getProjectPaths(projectConfig: ProjectConfiguration) {
  const paths = {
    configRoot: joinPathFragments(projectConfig.root, 'config'),
    packageJson: joinPathFragments(projectConfig.root, 'package.json'),
    projectJson: joinPathFragments(projectConfig.root, 'project.json'),
    tsconfig: {
      main: joinPathFragments(projectConfig.root, 'tsconfig.json'),
      lib: joinPathFragments(projectConfig.root, 'tsconfig.lib.json'),
      test: joinPathFragments(projectConfig.root, 'tsconfig.spec.json'),
      cypress: joinPathFragments(projectConfig.root, 'tsconfig.cy.json'),
    },
    sourceRoot: joinPathFragments(projectConfig.root, 'src'),
    unstable: {
      sourceRoot: joinPathFragments(projectConfig.root, 'src', 'unstable'),
      rootPackageJson: joinPathFragments(projectConfig.root, 'src', 'unstable', 'package.json__tmpl__'),
    },
    conformanceSetup: joinPathFragments(projectConfig.root, 'src', 'testing', 'isConformant.ts'),
    cypressConfig: joinPathFragments(projectConfig.root, 'cypress.config.js'),
    babelConfig: joinPathFragments(projectConfig.root, '.babelrc.json'),
    jestConfig: joinPathFragments(projectConfig.root, 'jest.config.js'),
    jestSetupFile: joinPathFragments(projectConfig.root, 'config', 'tests.js'),
    justConfig: joinPathFragments(projectConfig.root, 'just.config.ts'),
    rootTsconfig: '/tsconfig.base.json',
    rootPackageJson: '/package.json',
    rootJestPreset: '/jest.preset.js',
    rootJestConfig: '/jest.config.js',
    npmConfig: joinPathFragments(projectConfig.root, '.npmignore'),
    stories: joinPathFragments(projectConfig.root, 'stories'),
    storybook: {
      rootFolder: joinPathFragments(projectConfig.root, '.storybook'),
      tsconfig: joinPathFragments(projectConfig.root, '.storybook/tsconfig.json'),
      main: joinPathFragments(projectConfig.root, '.storybook/main.js'),
      preview: joinPathFragments(projectConfig.root, '.storybook/preview.js'),
    },
  };

  return paths;
}

export const workspacePaths = {
  nx: '/nx.json',
  tsconfig: '/tsconfig.base.json',
  packageJson: '/package.json',
  jest: { preset: '/jest.preset.js', config: '/jest.config.ts' },
  github: {
    root: '/.github',
    codeowners: joinPathFragments('/.github', 'CODEOWNERS'),
  },
  storybook: {
    root: '/.storyboook',
  },
};

export type UserLog = Array<{ type: keyof typeof logger; message: string }>;
export function printUserLogs(logs: UserLog) {
  if (logs.length === 0) {
    return;
  }

  logger.log(`${'='.repeat(80)}\n`);

  logs.forEach(log => logger[log.type](log.message));

  logger.log(`${'='.repeat(80)}\n`);
}

/**
 * Overridden `@nx/devkit#getProjects` function
 * Get all workspace projects or only subset, if projectNames array is specified
 *
 * @param tree
 * @param projectNames - array of project names. Use this to return only subset of projects
 */
export function getProjects(tree: Tree, projectNames?: string[]) {
  const allProjects = getAllProjects(tree);

  if (Array.isArray(projectNames) && projectNames.length > 0) {
    const pickedProjects: ReturnType<typeof getAllProjects> = new Map();

    for (const [projectName, projectConfig] of allProjects.entries()) {
      if (projectNames.includes(projectName)) {
        pickedProjects.set(projectName, projectConfig);
      }
    }

    return pickedProjects;
  }

  return allProjects;
}

export function hasSchemaFlag<T, K extends keyof T>(schema: T, flag: K): schema is T & Record<K, NonNullable<T[K]>> {
  return Boolean(schema[flag]);
}

export function isPackageVersionConverged(versionString: string) {
  const versionWithoutCaret = versionString.replace('^', '');

  const version = semver.parse(versionWithoutCaret);
  if (version === null) {
    throw new Error(`${versionWithoutCaret} is not a valid semver version`);
  }
  return version.major === 9;
}

export function isPackageVersionPrerelease(versionString: string) {
  const version = semver.parse(versionString);
  return Boolean(version?.prerelease?.length && version?.prerelease?.length > 0);
}

export function isPackageConverged(tree: Tree, project: ProjectConfiguration) {
  const hasVNextTag = !!project.tags?.includes('vNext');
  const packageJson = readJson<PackageJson>(tree, joinPathFragments(project.root, 'package.json'));
  return isPackageVersionConverged(packageJson.version) || hasVNextTag;
}

export function isV8Package(tree: Tree, project: ProjectConfiguration) {
  const packageJson = readJson<PackageJson>(tree, joinPathFragments(project.root, 'package.json'));
  return packageJson.version.startsWith('8.');
}

export function isToolsPackage(tree: Tree, project: ProjectConfiguration) {
  const hasToolsTag = !!project.tags?.includes('tools');
  const packageJson = readJson<PackageJson>(tree, joinPathFragments(project.root, 'package.json'));
  const isPrivate = !!packageJson.private;

  return hasToolsTag && !isPrivate && !isV8Package(tree, project);
}

export function packageJsonHasBeachballConfig(packageJson: PackageJson): packageJson is PackageJsonWithBeachball {
  return !!(packageJson as PackageJsonWithBeachball).beachball;
}

// ==========================
// Execution time measurement
// ==========================

export function measureStart(key: string) {
  performance.mark(`${key}:start`);
}
export function measureEnd(key: string) {
  performance.mark(`${key}:end`);
  const measure = performance.measure(key, `${key}:start`, `${key}:end`);

  logger.verbose(`Execution Timings: ${key} (${(measure.duration / 1000).toFixed(2)} s)`);
}

// =====================================
// TS path aliases opt-out for tsc runs
// =====================================

/**
 * All transient configs created by this module which have not been cleaned up yet.
 *
 * Registering them in one place keeps the number of process listeners constant - one listener per
 * module - no matter how many `tsc` invocations an executor performs.
 *
 * NOTE: behaviourally aligned with `scripts/tasks/src/utils.ts#createTsConfigWithoutPathAliases`.
 * The duplication is intentional - `tools/workspace-plugin` must not depend on the `just` based
 * v8 build tooling.
 */
const pendingTransientTsConfigs = new Set<string>();
let transientTsConfigsCounter = 0;
let processListenersRegistered = false;

function removeTransientTsConfig(generatedPath: string) {
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
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, cleanupTransientTsConfigsOnSignal);
  }
}

function cleanupTransientTsConfigsOnSignal(signal: NodeJS.Signals) {
  cleanupTransientTsConfigs();
  process.kill(process.pid, signal);
}

/**
 * Creates a transient tsconfig, next to `tsConfigPath`, which turns TS path aliases off
 * (`"paths": null`) for a single `tsc` invocation and returns its path.
 *
 * TypeScript 6 deprecates `baseUrl`, which used to be (ab)used as `tsc --baseUrl <projectRoot>`
 * to make the workspace root relative `paths` entries unresolvable. TypeScript 6 resolves
 * `paths` relative to the config file that declares them, so nulling `paths` is now the only
 * supported way to opt a compilation out of path aliases - and it cannot be expressed via CLI
 * flags, only via a config file.
 *
 * NOTES:
 * - the generated config lives next to the original one, so every relative path
 *   (`extends`/`include`/`outDir`/`rootDir`/`references`) keeps resolving identically
 * - the file name is unique per process and invocation, so the concurrent `tsc` runs this
 *   executor spawns can never delete each other's config
 */
export function createTsConfigWithoutPathAliases(tsConfigPath: string, purpose: string) {
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
