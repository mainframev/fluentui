import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { type JscTarget, transform } from '@swc/core';
import glob from 'glob';

import { postprocessOutput } from './utils';

export interface TranspileEmittedOptions {
  /**
   * Directory with already emitted `.js` files (relative to `root`), eg `lib`.
   */
  inputPath: string;
  /**
   * Directory to write transpiled files to (relative to `root`).
   *
   * Setting it to the same value as `inputPath` transpiles the emitted output in place.
   */
  outputPath: string;
  /**
   * Module format of the emitted output.
   *
   * Input is always ESM (`es6`) or CommonJS - `es6`/`commonjs` keep the module format as is,
   * `amd` converts ESM output to AMD.
   */
  module: 'es6' | 'commonjs' | 'amd';
  /**
   * ECMAScript version that the output will be downleveled to.
   */
  target: JscTarget;
  /**
   * @defaultValue process.cwd()
   */
  root?: string;
}

/**
 * Transpiles (downlevels / re-modularizes) JavaScript that has already been emitted by `tsc`.
 *
 * TypeScript 6 removed `target: 'es5'` and `module: 'amd'`, so the ES5/AMD artifacts that v8
 * packages publish cannot be produced by the compiler anymore. This mirrors what converged
 * (v9) packages that ship AMD already do - `tsc` handles types, SWC handles the JS emit.
 *
 * NOTES:
 * - source maps emitted by `tsc` are chained (`inputSourceMap`), so the final `.map` keeps
 *   pointing at the original `.ts` sources
 * - `.swcrc` lookup is disabled on purpose, the whole configuration lives here so that every
 *   package built by the shared preset produces identical output
 */
export async function transpileEmittedJs(options: TranspileEmittedOptions): Promise<string[]> {
  const { inputPath, outputPath, module, target, root = process.cwd() } = options;

  const absoluteInputPath = path.resolve(root, inputPath);
  const absoluteOutputPath = path.resolve(root, outputPath);

  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(
      `swc: cannot transpile "${inputPath}" -> "${outputPath}", because "${absoluteInputPath}" doesn't exist. ` +
        `This step runs on compiler emitted output, thus the tsc compilation needs to run first ` +
        `(eg use "--module esm,amd" instead of "--module amd").`,
    );
  }

  const fileNames = glob.sync('**/*.js', { cwd: absoluteInputPath, nodir: true });

  await eachLimit(fileNames, concurrencyLimit, fileName =>
    transpileFile({ fileName, absoluteInputPath, absoluteOutputPath, module, target }),
  );

  return fileNames;
}

const concurrencyLimit = Math.max(1, os.cpus().length);
const sourceMappingUrlRegex = /\n?\/\/# sourceMappingURL=\S*/g;

async function transpileFile(options: {
  fileName: string;
  absoluteInputPath: string;
  absoluteOutputPath: string;
  module: TranspileEmittedOptions['module'];
  target: JscTarget;
}) {
  const { fileName, absoluteInputPath, absoluteOutputPath, module, target } = options;

  const inputFilePath = path.join(absoluteInputPath, fileName);
  const outputFilePath = path.join(absoluteOutputPath, fileName);

  const sourceCode = await fs.promises.readFile(inputFilePath, 'utf-8');
  const inputSourceMap = await readIfExists(`${inputFilePath}.map`);

  const result = await transform(sourceCode, {
    filename: inputFilePath,
    // the configuration is fully defined here - `.swcrc` of the package (if any) configures the source -> `lib` compilation, which is a different transformation
    swcrc: false,
    configFile: false,
    module: { type: module },
    jsc: {
      parser: { syntax: 'ecmascript' },
      target,
      /**
       * v8 packages depend on `tslib`, which SWC cannot emit helper imports for (it only supports `@swc/helpers`).
       * Inlining the handful of downlevel helpers keeps this a build only change - no new runtime dependency is introduced to published packages.
       */
      externalHelpers: false,
    },
    sourceMaps: Boolean(inputSourceMap),
    inputSourceMap,
    outputPath: absoluteOutputPath,
  });

  // swc keeps the `//# sourceMappingURL` comment of the input in place, which for wrapped output (amd) ends up within the module factory
  const code = postprocessOutput(result.code).replace(sourceMappingUrlRegex, '');

  await fs.promises.mkdir(path.dirname(outputFilePath), { recursive: true });

  if (!result.map) {
    await fs.promises.writeFile(outputFilePath, code);
    return;
  }

  const sourceMapFileName = `${path.basename(fileName)}.map`;

  await fs.promises.writeFile(outputFilePath, `${code}\n//# sourceMappingURL=${sourceMapFileName}`);
  await fs.promises.writeFile(`${outputFilePath}.map`, result.map);
}

async function readIfExists(filePath: string) {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch {
    return undefined;
  }
}

async function eachLimit<T>(items: T[], limit: number, iteratee: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    let item = queue.shift();
    while (item !== undefined) {
      await iteratee(item);
      item = queue.shift();
    }
  });

  await Promise.all(workers);
}
