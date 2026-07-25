import * as fs from 'fs';
import * as path from 'path';

import glob from 'glob';
import { TaskFunction, TscTaskOptions, logger, tscTask } from 'just-scripts';

import { getJustArgv } from './argv';
import { transpileEmittedJs } from './swc';
import { createTsConfigWithoutPathAliases, getTsPathAliasesConfig, getTsPathAliasesConfigUsedOnlyForDx } from './utils';

const libPath = path.resolve(process.cwd(), 'lib');
const srcPath = path.resolve(process.cwd(), 'src');
// Temporary hack: only use tsbuildinfo file for things under packages/fluentui
const useTsBuildInfo =
  /[\\/]packages[\\/]fluentui[\\/]/.test(process.cwd()) && path.basename(process.cwd()) !== 'perf-test-northstar';

const outputPaths = { esm: 'lib', commonjs: 'lib-commonjs', amd: 'lib-amd' } as const;

/**
 * ECMAScript version that packages flagged with the `ships-es5` project tag published before the
 * TypeScript 6 migration.
 *
 * TypeScript 6 removed `target: 'es5'`, so this is applied by SWC on top of the compiler emitted
 * output instead of by `tsc` itself. Which packages are on that baseline is explicit project
 * metadata (`ships-es5`), never inferred - see `metadata-utils.ts#shipsES5`.
 */
const downlevelTarget = 'es5';

/**
 * ECMAScript version of the `lib-amd` artifact.
 *
 * Pre TypeScript 6 the AMD output was emitted by a dedicated `tsc --target es5 --module amd` run,
 * which overrode the `target` of the package tsconfig. Therefore `lib-amd` is ES5 for every package
 * that ships it, even for the ones whose `lib`/`lib-commonjs` are on a modern baseline.
 */
const amdTarget = 'es5';

function prepareTsTaskConfig(options: TscTaskOptions): { options: TscTaskOptions; cleanup: () => void } {
  // docs say pretty is on by default, but it's actually disabled when tsc is run in a
  // non-TTY context (which is what just-scripts tscTask does)
  // https://github.com/nrwl/nx/issues/9069#issuecomment-1048028504
  options.pretty = true;

  if (getJustArgv().production) {
    // sourceMap must be true for inlineSources and sourceRoot to work
    options.inlineSources = true;
    options.sourceRoot = path.relative(libPath, srcPath);
    options.sourceMap = true;
  }

  const { isUsingPathAliasesForDx, tsConfigFileForCompilation } = getTsPathAliasesConfigUsedOnlyForDx();

  if (isUsingPathAliasesForDx()) {
    logger.info(`📣 TSC: Project is using TS path aliases for DX. Disabling aliases for build.`);
    const noPathAliasesConfig = createTsConfigWithoutPathAliases(tsConfigFileForCompilation, 'build');

    options.rootDir = './src';
    options.project = noPathAliasesConfig.path;

    return { options, cleanup: noPathAliasesConfig.cleanup };
  }

  const { isUsingTsSolutionConfigs, tsConfigFileNames, tsConfigs } = getTsPathAliasesConfig();

  if (isUsingTsSolutionConfigs && tsConfigs.lib) {
    logger.info(`📣 TSC: package is using TS path aliases. Overriding tsconfig settings.`);

    const tsConfigOutDir = tsConfigs.lib.compilerOptions.outDir as string;

    options.outDir = `${tsConfigOutDir}/${options.outDir}`;
    options.project = tsConfigFileNames.lib;
  }

  return { options, cleanup: noop };
}

function noop() {
  /* nothing to clean up */
}

/**
 * Guarantees that transient build artifacts (the generated "no path aliases" tsconfig) are removed
 * as soon as the compilation finished, instead of relying on the process exit hook only.
 */
function withCleanup(taskFn: TaskFunction, cleanup: () => void): TaskFunction {
  return function tscWithCleanup(this: unknown, ...args: Parameters<TaskFunction>) {
    let result;

    try {
      result = (taskFn as (...taskArgs: Parameters<TaskFunction>) => unknown).apply(this, args);
    } catch (err) {
      cleanup();
      throw err;
    }

    if (result instanceof Promise) {
      return result.then(
        value => {
          cleanup();
          return value;
        },
        err => {
          cleanup();
          throw err;
        },
      );
    }

    cleanup();

    return result;
  } as TaskFunction;
}

export const ts = {
  commonjs: () => {
    const { options, cleanup } = prepareTsTaskConfig({
      outDir: outputPaths.commonjs,
      module: 'commonjs',
      ...(useTsBuildInfo && { tsBuildInfoFile: '.commonjs.tsbuildinfo' }),
    });

    return withCleanup(tscTask(options), cleanup);
  },
  esm: () => {
    const { options, cleanup } = prepareTsTaskConfig({
      outDir: outputPaths.esm,
      module: 'esnext',
    });

    // Use default tsbuildinfo for this variant
    return withCleanup(tscTask(options), cleanup);
  },
  /**
   * Downlevels compiler emitted `lib`(ESM) and `lib-commonjs`(CJS) output to the ES5 baseline that
   * packages tagged `ships-es5` published before the TypeScript 6 migration.
   *
   * TypeScript 6 removed `target: 'es5'`, so the ES5 emit moved out of the compiler - `tsc` type checks and emits
   * declarations + modern JS, SWC downlevels the JS, which is the very same split that converged packages shipping
   * AMD (`@fluentui/react-portal-compat*`) already use.
   */
  downlevel: async () => {
    const moduleFlag = getJustArgv().module;
    const moduleOutputs = [
      { module: 'es6', outputPath: outputPaths.esm, enabled: moduleFlag ? moduleFlag.esm : true },
      { module: 'commonjs', outputPath: outputPaths.commonjs, enabled: moduleFlag ? moduleFlag.cjs : true },
    ] as const;

    for (const { module, outputPath, enabled } of moduleOutputs) {
      if (!enabled) {
        continue;
      }

      if (!fs.existsSync(path.resolve(process.cwd(), outputPath))) {
        logger.info(`📣 SWC: "${outputPath}" doesn't exist. Skipping ${downlevelTarget} downlevel.`);
        continue;
      }

      const result = await transpileEmittedJs({
        inputPath: outputPath,
        outputPath,
        module,
        target: downlevelTarget,
      });

      logger.info(
        `📣 SWC: downleveled ${result.transpiled.length}/${result.files.length} files in "${outputPath}" to ${downlevelTarget}.`,
      );
    }
  },
  /**
   * Creates the AMD (`lib-amd`) artifact from the emitted ESM output.
   *
   * TypeScript 6 removed `module: 'amd'` - and `moduleResolution: 'bundler'`, which v8 packages use, is not
   * compatible with it either - so the module transform is done by SWC. Declaration files are module format
   * agnostic, therefore they are copied over from `lib` instead of being re-emitted.
   *
   * `lib-amd` is a fully derived directory: files which don't exist in `lib` anymore are pruned, so partial
   * or repeated invocations can never leave stale artifacts behind.
   */
  amd: async () => {
    const result = await transpileEmittedJs({
      inputPath: outputPaths.esm,
      outputPath: outputPaths.amd,
      module: 'amd',
      target: amdTarget,
    });
    const declarations = syncDeclarations(outputPaths.esm, outputPaths.amd);

    logger.info(
      `📣 SWC: created "${outputPaths.amd}" from "${outputPaths.esm}" (${result.transpiled.length}/${
        result.files.length
      } files, ${declarations.copied.length} declarations, ${
        result.pruned.length + declarations.pruned.length
      } stale files pruned).`,
    );
  },
};

/**
 * Copies declarations of `fromPath` over to `toPath` and removes the ones which don't exist in `fromPath` anymore.
 */
function syncDeclarations(fromPath: string, toPath: string) {
  const absoluteFromPath = path.resolve(process.cwd(), fromPath);
  const absoluteToPath = path.resolve(process.cwd(), toPath);
  const fileNames = glob.sync('**/*.d.ts', { cwd: absoluteFromPath, nodir: true });

  for (const fileName of fileNames) {
    const destination = path.join(absoluteToPath, fileName);

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(absoluteFromPath, fileName), destination);
  }

  const expected = new Set(fileNames);
  const pruned: string[] = [];

  for (const fileName of glob.sync('**/*.d.ts', { cwd: absoluteToPath, nodir: true })) {
    if (expected.has(fileName)) {
      continue;
    }

    fs.rmSync(path.join(absoluteToPath, fileName), { force: true });
    pruned.push(fileName);
  }

  return { copied: fileNames, pruned };
}
