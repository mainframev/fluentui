import { createHash } from 'node:crypto';
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
   * Remove files within `outputPath` which have no counterpart in `inputPath` anymore.
   *
   * @defaultValue `true` for derived outputs (`inputPath !== outputPath`), `false` otherwise
   */
  prune?: boolean;
  /**
   * @defaultValue process.cwd()
   */
  root?: string;
}

export interface TranspileEmittedResult {
  /**
   * Every `.js` file found within `inputPath`.
   */
  files: string[];
  /**
   * Files which were (re)transpiled by this invocation.
   */
  transpiled: string[];
  /**
   * Stale files removed from `outputPath`.
   */
  pruned: string[];
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
 * - the transform is idempotent: a content addressed manifest (see {@link readManifest}) records
 *   what was produced from what, so already transpiled output is never transpiled again, even
 *   when the task is invoked repeatedly or only for a subset of module formats
 */
export async function transpileEmittedJs(options: TranspileEmittedOptions): Promise<TranspileEmittedResult> {
  const { inputPath, outputPath, module, target, root = process.cwd(), prune = inputPath !== outputPath } = options;

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

  const manifestPath = getManifestPath({ root, outputPath });
  const previousManifest = readManifest({ manifestPath, module, target });
  const manifest: Manifest = { version: manifestVersion, module, target, files: {} };
  const transpiled: string[] = [];

  await eachLimit(fileNames, concurrencyLimit, async fileName => {
    const entry = await transpileFile({
      fileName,
      absoluteInputPath,
      absoluteOutputPath,
      module,
      target,
      previousEntry: previousManifest?.files[fileName],
      onTranspiled: () => transpiled.push(fileName),
    });

    manifest.files[fileName] = entry;
  });

  const pruned = prune ? pruneStaleOutputs({ absoluteOutputPath, fileNames }) : [];

  writeManifest(manifestPath, manifest);

  return { files: fileNames, transpiled, pruned };
}

const concurrencyLimit = Math.max(1, os.cpus().length);
const sourceMappingUrlRegex = /\n?\/\/# sourceMappingURL=\S*/g;
/**
 * Bump whenever the emitted output changes (swc options, postprocessing, ...) so that stale
 * manifests never mark outdated output as up to date.
 */
const manifestVersion = 1;

interface ManifestEntry {
  /** hash of the compiler emitted input (`.js` + `.js.map`) the output was created from */
  source: string;
  /** hash of the transpiled output (`.js` + `.js.map`) */
  output: string;
}
interface Manifest {
  version: number;
  module: TranspileEmittedOptions['module'];
  target: JscTarget;
  files: Record<string, ManifestEntry>;
}

/**
 * The manifest is a build artifact - it lives in the project's `node_modules/.cache`, which is
 * ignored by both git and npm, so it can never leak into a published package.
 */
function getManifestPath(options: { root: string; outputPath: string }) {
  const fileName = `${options.outputPath.replace(/[\\/:]/g, '-')}.json`;

  return path.join(options.root, 'node_modules', '.cache', 'fluentui-swc-transpile', fileName);
}

function readManifest(options: { manifestPath: string; module: string; target: string }): Manifest | undefined {
  try {
    const manifest: Manifest = JSON.parse(fs.readFileSync(options.manifestPath, 'utf-8'));

    if (
      manifest.version !== manifestVersion ||
      manifest.module !== options.module ||
      manifest.target !== options.target
    ) {
      return undefined;
    }

    return manifest;
  } catch {
    return undefined;
  }
}

function writeManifest(manifestPath: string, manifest: Manifest) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest), 'utf-8');
}

function hashContent(code: string, sourceMap: string | undefined) {
  return createHash('sha256')
    .update(code)
    .update('\u0000')
    .update(sourceMap ?? '')
    .digest('hex');
}

async function transpileFile(options: {
  fileName: string;
  absoluteInputPath: string;
  absoluteOutputPath: string;
  module: TranspileEmittedOptions['module'];
  target: JscTarget;
  previousEntry: ManifestEntry | undefined;
  onTranspiled: () => void;
}): Promise<ManifestEntry> {
  const { fileName, absoluteInputPath, absoluteOutputPath, module, target, previousEntry, onTranspiled } = options;

  const inputFilePath = path.join(absoluteInputPath, fileName);
  const outputFilePath = path.join(absoluteOutputPath, fileName);
  const isInPlace = inputFilePath === outputFilePath;

  const sourceCode = await fs.promises.readFile(inputFilePath, 'utf-8');
  const inputSourceMap = await readIfExists(`${inputFilePath}.map`);
  const sourceHash = hashContent(sourceCode, inputSourceMap);

  if (previousEntry) {
    // in place output: the file we just read is the output of a previous invocation
    if (isInPlace && previousEntry.output === sourceHash) {
      return previousEntry;
    }

    // derived output: input is unchanged and the output produced from it is still on disk
    if (!isInPlace && previousEntry.source === sourceHash) {
      const outputCode = await readIfExists(outputFilePath);
      const outputSourceMap = await readIfExists(`${outputFilePath}.map`);

      if (outputCode !== undefined && hashContent(outputCode, outputSourceMap) === previousEntry.output) {
        return previousEntry;
      }
    }
  }

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
       * Helpers are imported from `@swc/helpers` instead of being inlined into every emitted file.
       *
       * Inlining duplicates the (downlevel + module interop) helpers per file, which measurably
       * bloats the published artifacts (~13% of `lib`, ~21% of `lib-amd` for `@fluentui/utilities`).
       * Every package built with this pipeline declares `@swc/helpers` as a runtime dependency -
       * the very same contract that converged packages compiled by `swc` already ship.
       */
      externalHelpers: true,
    },
    sourceMaps: Boolean(inputSourceMap),
    inputSourceMap,
    outputPath: absoluteOutputPath,
  });

  // swc keeps the `//# sourceMappingURL` comment of the input in place, which for wrapped output (amd) ends up within the module factory
  const code = postprocessOutput(result.code).replace(sourceMappingUrlRegex, '');

  await fs.promises.mkdir(path.dirname(outputFilePath), { recursive: true });

  onTranspiled();

  if (!result.map) {
    await fs.promises.writeFile(outputFilePath, code);
    // a previous invocation might have emitted a map for this file
    await fs.promises.rm(`${outputFilePath}.map`, { force: true });

    return { source: sourceHash, output: hashContent(code, undefined) };
  }

  const sourceMapFileName = `${path.basename(fileName)}.map`;
  const outputCode = `${code}\n//# sourceMappingURL=${sourceMapFileName}`;

  await fs.promises.writeFile(outputFilePath, outputCode);
  await fs.promises.writeFile(`${outputFilePath}.map`, result.map);

  return { source: sourceHash, output: hashContent(outputCode, result.map) };
}

/**
 * Removes `.js`/`.js.map` files from a derived output directory which have no counterpart in the
 * compiler emitted input anymore (eg a source file was renamed or deleted between builds).
 */
function pruneStaleOutputs(options: { absoluteOutputPath: string; fileNames: string[] }) {
  const { absoluteOutputPath, fileNames } = options;

  if (!fs.existsSync(absoluteOutputPath)) {
    return [];
  }

  const expected = new Set(fileNames);
  const pruned: string[] = [];

  for (const fileName of glob.sync('**/*.js', { cwd: absoluteOutputPath, nodir: true })) {
    if (expected.has(fileName)) {
      continue;
    }

    const staleFilePath = path.join(absoluteOutputPath, fileName);

    fs.rmSync(staleFilePath, { force: true });
    fs.rmSync(`${staleFilePath}.map`, { force: true });
    pruned.push(fileName);
  }

  return pruned;
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
