import * as fs from 'fs';
import * as path from 'path';

import glob from 'glob';
import { TscTaskOptions, logger, tscTask } from 'just-scripts';

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
 * ECMAScript version that v8 packages publish.
 *
 * TypeScript 6 removed `target: 'es5'`, so this is applied by SWC on top of the compiler emitted output
 * instead of by `tsc` itself.
 */
const publishedTarget = 'es5';

function prepareTsTaskConfig(options: TscTaskOptions) {
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
    options.rootDir = './src';
    options.project = createTsConfigWithoutPathAliases(tsConfigFileForCompilation, 'build').path;

    return options;
  }

  const { isUsingTsSolutionConfigs, tsConfigFileNames, tsConfigs } = getTsPathAliasesConfig();

  if (isUsingTsSolutionConfigs && tsConfigs.lib) {
    logger.info(`📣 TSC: package is using TS path aliases. Overriding tsconfig settings.`);

    const tsConfigOutDir = tsConfigs.lib.compilerOptions.outDir as string;

    options.outDir = `${tsConfigOutDir}/${options.outDir}`;
    options.project = tsConfigFileNames.lib;
  }

  return options;
}

export const ts = {
  commonjs: () => {
    const options = prepareTsTaskConfig({
      outDir: outputPaths.commonjs,
      module: 'commonjs',
      ...(useTsBuildInfo && { tsBuildInfoFile: '.commonjs.tsbuildinfo' }),
    });

    return tscTask(options);
  },
  esm: () => {
    const options = prepareTsTaskConfig({
      outDir: outputPaths.esm,
      module: 'esnext',
    });

    // Use default tsbuildinfo for this variant
    return tscTask(options);
  },
  /**
   * Downlevels compiler emitted `lib`(ESM) and `lib-commonjs`(CJS) output to the ES5 baseline that v8 packages publish.
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
        logger.info(`📣 SWC: "${outputPath}" doesn't exist. Skipping ${publishedTarget} downlevel.`);
        continue;
      }

      const transpiledFiles = await transpileEmittedJs({
        inputPath: outputPath,
        outputPath,
        module,
        target: publishedTarget,
      });

      logger.info(`📣 SWC: downleveled ${transpiledFiles.length} files in "${outputPath}" to ${publishedTarget}.`);
    }
  },
  /**
   * Creates the AMD (`lib-amd`) artifact from the emitted ESM output.
   *
   * TypeScript 6 removed `module: 'amd'` - and `moduleResolution: 'bundler'`, which v8 packages use, is not
   * compatible with it either - so the module transform is done by SWC. Declaration files are module format
   * agnostic, therefore they are copied over from `lib` instead of being re-emitted.
   */
  amd: async () => {
    const transpiledFiles = await transpileEmittedJs({
      inputPath: outputPaths.esm,
      outputPath: outputPaths.amd,
      module: 'amd',
      target: publishedTarget,
    });
    const copiedDeclarations = copyDeclarations(outputPaths.esm, outputPaths.amd);

    logger.info(
      `📣 SWC: created "${outputPaths.amd}" from "${outputPaths.esm}" (${transpiledFiles.length} files, ${copiedDeclarations.length} declarations).`,
    );
  },
};

function copyDeclarations(fromPath: string, toPath: string) {
  const absoluteFromPath = path.resolve(process.cwd(), fromPath);
  const absoluteToPath = path.resolve(process.cwd(), toPath);
  const fileNames = glob.sync('**/*.d.ts', { cwd: absoluteFromPath, nodir: true });

  for (const fileName of fileNames) {
    const destination = path.join(absoluteToPath, fileName);

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(absoluteFromPath, fileName), destination);
  }

  return fileNames;
}
