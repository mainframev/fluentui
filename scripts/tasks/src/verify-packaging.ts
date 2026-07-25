import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import micromatch from 'micromatch';
import * as ts from 'typescript';

import type { JustArgs } from './argv';
import { type EsTarget, type ModuleShape, detectModuleShape, findSyntaxAboveTarget } from './ecma-syntax';

/**
 * @see https://docs.npmjs.com/cli/v10/commands/npm-publish#files-included-in-package
 */
const alwaysPublishedFiles = ['LICENSE', 'package.json', 'README.md'];
const rootConfigFiles = [
  'just.config.[jt]s',
  'jest.config.[jt]s',
  'eslint.config.(js|cjs|mjs)',
  'project.json',
  '.babelrc.json',
  '.swcrc',
  'tsconfig(.*)?.json',
];
const nonProdAssets = ['assets/', 'docs/*', 'temp/*', 'bundle-size/*', '.storybook/*', 'stories/*'];

/**
 * Amount of files per artifact folder which are parsed to verify the emitted syntax/module shape.
 *
 * The whole file list is verified for coverage (every `.js` has its declaration, `lib-amd` mirrors
 * `lib`), only the (evenly spread) sample is parsed - packages like `@fluentui/react` ship
 * thousands of files, parsing all of them on every CI run would not pay off.
 */
const artifactSampleSize = 40;

/**
 * eg `import { _ } from "@swc/helpers/_/_class_call_check"` / `require("@swc/helpers/_/_export_star")`
 */
const runtimeHelperSpecifierRegex = /["'](@swc\/helpers\/[^"']+)["']/g;

interface Options extends Partial<JustArgs> {}
export function verifyPackaging(options: Options) {
  const cwd = process.cwd();
  const packageJSON: { private?: boolean } = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf-8'));

  // no need to check if package is not being published yet
  if (packageJSON.private) {
    return;
  }

  const projectJSON: import('@nx/devkit').ProjectConfiguration = JSON.parse(
    readFileSync(path.join(cwd, 'project.json'), 'utf-8'),
  );
  const tags = projectJSON.tags ?? [];

  const npmPackResult = spawnSync('npm', ['pack', '--dry-run']);

  const processedResult = npmPackResult.output
    .toString()
    .replace(/\bnpm notice\b\s+[\d.]+[MkB]+\s+/gi, '')
    .replace(/[ ]+/g, '');
  const processedResultArr = processedResult.split('\n');

  const isV8package = tags.indexOf('v8') !== -1;
  const isV9package = tags.indexOf('vNext') !== -1;
  const shipsAMD = isV8package || tags.indexOf('ships-amd') !== -1;
  const shipsBundle = tags.indexOf('ships-bundle') !== -1;
  const shipsUmd = tags.indexOf('ships-umd') !== -1;
  const shipsES5 = tags.indexOf('ships-es5') !== -1;
  const platform = { web: tags.indexOf('platform:web') !== -1, node: tags.indexOf('platform:node') !== -1 };

  // shared assertions
  assert.ok(micromatch(processedResultArr, alwaysPublishedFiles).length, `npm always shipped files`);
  assert.equal(
    micromatch(processedResultArr, nonProdAssets).length,
    0,
    `wont ship non production code related folders/files`,
  );
  assert.ok(micromatch(processedResultArr, 'CHANGELOG.md').length, 'ships changelog markdown file');
  assert.ok(micromatch(processedResultArr, 'dist/*.d.ts').length, 'ships rolluped dts');
  assert.ok(micromatch(processedResultArr, 'lib-commonjs/**/*.(js|map)').length, 'ships cjs');
  assert.equal(micromatch(processedResultArr, 'src/*').length, 0, `wont ship source code from "/src"`);

  if (!isV8package) {
    assert.equal(micromatch(processedResultArr, rootConfigFiles).length, 0, `wont ship configuration files`);
  }

  if (!platform.node) {
    assert.ok(micromatch(processedResultArr, 'lib/**/*.(js|map)').length, 'ships esm');
  }

  if (isV9package) {
    assert.equal(micromatch(processedResultArr, 'config/*').length, 0, `wont ship config folder`);
    assert.equal(micromatch(processedResultArr, 'etc/*').length, 0, `wont ship etc folder"`);
  }

  if (isV8package) {
    assert.ok(micromatch(processedResultArr, '(lib|lib-commonjs)/**/*.d.ts').length, `ships dts`);

    if (options.production && shipsBundle) {
      assert.ok(micromatch(processedResultArr, 'dist/*.js').length, `ships bundle`);
      assert.ok(micromatch(processedResultArr, 'dist/*.min.js').length, `ships minified bundle`);
    }
    if (options.production && shipsUmd) {
      assert.ok(micromatch(processedResultArr, 'dist/*.umd.js').length, `ships umd`);
    }
  }

  // @FIXME `amd` is created only on release pipeline where `--production` flag is used on build commands which triggers it
  // we should enable this also on PR pipelines - need to verify time execution impact
  if (options.production && shipsAMD) {
    assert.ok(micromatch(processedResultArr, 'lib-amd/**/*.(js|map)').length, 'ships amd');
  }

  verifyArtifacts({ cwd, packedFiles: processedResultArr, isV8package, shipsES5 });
}

/**
 * Verifies the actual content of the published JavaScript artifacts.
 *
 * TypeScript 6 removed `target: 'es5'` and `module: 'amd'`, so `lib`/`lib-commonjs`/`lib-amd` are
 * not emitted by `tsc` alone anymore - a SWC post processing step downlevels the compiler output
 * and re-modularizes it. Asserting on the file list only would not notice if that step silently
 * stopped running, ran with the wrong target or left stale files behind.
 */
function verifyArtifacts(options: { cwd: string; packedFiles: string[]; isV8package: boolean; shipsES5: boolean }) {
  const { cwd, packedFiles, isV8package, shipsES5 } = options;

  if (!isV8package) {
    return;
  }

  const compilerTarget = readCompilerTarget(cwd);
  const artifacts = [
    { dir: 'lib', target: shipsES5 ? ('es5' as const) : compilerTarget, shape: 'esm' as const },
    { dir: 'lib-commonjs', target: shipsES5 ? ('es5' as const) : compilerTarget, shape: 'commonjs' as const },
    /**
     * pre TS6 `lib-amd` was emitted by a dedicated `tsc --target es5 --module amd` run which
     * overrode the package `target`, so it is ES5 for every package which ships it
     */
    { dir: 'lib-amd', target: 'es5' as const, shape: 'amd' as const },
  ];

  const libFiles = publishedFiles(packedFiles, 'lib');

  for (const artifact of artifacts) {
    const jsFiles = publishedFiles(packedFiles, artifact.dir);

    if (jsFiles.length === 0) {
      continue;
    }

    verifyDeclarationCoverage({ packedFiles, dir: artifact.dir, jsFiles });
    verifyRuntimeHelpers({ cwd, dir: artifact.dir, jsFiles });

    if (artifact.dir === 'lib-amd' && libFiles.length > 0) {
      assert.deepEqual(
        jsFiles,
        libFiles,
        `"lib-amd" mirrors "lib" - stale or missing AMD files: ${JSON.stringify(
          symmetricDifference(jsFiles, libFiles),
        )}`,
      );
    }

    for (const fileName of sample(jsFiles, artifactSampleSize)) {
      const filePath = path.join(cwd, artifact.dir, fileName);

      if (!existsSync(filePath)) {
        continue;
      }

      const code = readFileSync(filePath, 'utf-8');

      assert.deepEqual(
        findSyntaxAboveTarget(code, artifact.target, filePath).map(feature => `${feature.name}(${feature.minTarget})`),
        [],
        `"${artifact.dir}/${fileName}" is emitted for "${artifact.target}"`,
      );

      const actualShape = detectModuleShape(code, filePath);
      const expectedShapes = allowedShapes({
        artifactDir: artifact.dir,
        expected: artifact.shape,
        cwd,
        fileName,
      });

      assert.ok(
        expectedShapes.includes(actualShape),
        `"${artifact.dir}/${fileName}" is emitted as "${expectedShapes.join('|')}" module, got "${actualShape}"`,
      );
    }
  }
}

/**
 * Modules without any import/export are emitted as plain scripts by every module transform, so
 * they are a valid shape everywhere. AMD wrapping is required only if the ESM counterpart is a
 * real module.
 */
function allowedShapes(options: {
  artifactDir: string;
  expected: ModuleShape;
  cwd: string;
  fileName: string;
}): ModuleShape[] {
  const { artifactDir, expected, cwd, fileName } = options;

  if (artifactDir !== 'lib-amd') {
    return [expected, 'script'];
  }

  const esmFilePath = path.join(cwd, 'lib', fileName);

  if (existsSync(esmFilePath) && detectModuleShape(readFileSync(esmFilePath, 'utf-8'), esmFilePath) === 'esm') {
    return ['amd'];
  }

  return ['amd', 'script'];
}

/**
 * Every helper the emitted artifacts import must be provided by the `@swc/helpers` version the
 * package declares.
 *
 * `@swc/core` grows/renames its helper set over time (eg `_create_super` -> `_call_super`), so the
 * emitted output and the declared runtime dependency can silently drift apart - the artifact would
 * then fail with `MODULE_NOT_FOUND` in a consumer's app instead of during the build.
 */
function verifyRuntimeHelpers(options: { cwd: string; dir: string; jsFiles: string[] }) {
  const { cwd, dir, jsFiles } = options;
  const helperSpecifiers = new Set<string>();

  for (const fileName of jsFiles) {
    const filePath = path.join(cwd, dir, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    for (const match of readFileSync(filePath, 'utf-8').matchAll(runtimeHelperSpecifierRegex)) {
      helperSpecifiers.add(match[1]);
    }
  }

  const unresolvable = [...helperSpecifiers].filter(specifier => {
    try {
      require.resolve(specifier, { paths: [cwd] });
      return false;
    } catch {
      return true;
    }
  });

  assert.deepEqual(
    unresolvable,
    [],
    `every runtime helper imported by "${dir}" is provided by the declared "@swc/helpers" dependency ` +
      `(raise the declared version range if the emitted helper set moved on)`,
  );
}

function verifyDeclarationCoverage(options: { packedFiles: string[]; dir: string; jsFiles: string[] }) {
  const { packedFiles, dir, jsFiles } = options;
  const declarations = new Set(
    packedFiles
      .filter(filePath => filePath.startsWith(`${dir}/`) && filePath.endsWith('.d.ts'))
      .map(filePath => filePath.slice(dir.length + 1)),
  );

  const missing = jsFiles.filter(fileName => !declarations.has(fileName.replace(/\.js$/, '.d.ts')));

  assert.deepEqual(missing, [], `every published "${dir}" module ships its declaration counterpart`);
}

function publishedFiles(packedFiles: string[], dir: string) {
  return packedFiles
    .filter(filePath => filePath.startsWith(`${dir}/`) && filePath.endsWith('.js'))
    .map(filePath => filePath.slice(dir.length + 1))
    .sort();
}

function symmetricDifference(a: string[], b: string[]) {
  const setA = new Set(a);
  const setB = new Set(b);

  return [...a.filter(item => !setB.has(item)), ...b.filter(item => !setA.has(item))];
}

/**
 * Evenly spread selection so that the sample covers the whole (alphabetically sorted) file list.
 */
function sample(files: string[], size: number) {
  if (files.length <= size) {
    return files;
  }

  const step = files.length / size;
  const picked = new Set<string>();

  if (files.includes('index.js')) {
    picked.add('index.js');
  }

  for (let i = 0; i < size; i++) {
    picked.add(files[Math.floor(i * step)]);
  }

  return [...picked];
}

const esTargetByScriptTargetName: Record<string, EsTarget> = {
  ES5: 'es5',
  ES2015: 'es2015',
  ES2016: 'es2016',
  ES2017: 'es2017',
  ES2018: 'es2018',
  ES2019: 'es2019',
  ES2020: 'es2020',
  ES2021: 'es2021',
  ES2022: 'es2022',
};

/**
 * ECMAScript version the package compiles to. Anything newer than what this check knows about
 * (ES2023+, ESNext) is verified as ES2022, which is the newest baseline it can assert on.
 */
function readCompilerTarget(cwd: string): EsTarget {
  const configFileName = ['tsconfig.lib.json', 'tsconfig.json'].find(fileName => existsSync(path.join(cwd, fileName)));

  if (!configFileName) {
    return 'es2022';
  }

  const configFilePath = path.join(cwd, configFileName);
  const { config, error } = ts.readConfigFile(configFilePath, ts.sys.readFile);

  if (error || !config) {
    return 'es2022';
  }

  const parsed = ts.parseJsonConfigFileContent(
    config,
    // file globbing is not needed, only the resolved `compilerOptions`
    { ...ts.sys, readDirectory: () => [] },
    cwd,
    undefined,
    configFilePath,
  );
  const target = parsed.options.target;

  if (target === undefined) {
    return 'es2022';
  }

  return esTargetByScriptTargetName[ts.ScriptTarget[target] as string] ?? 'es2022';
}
