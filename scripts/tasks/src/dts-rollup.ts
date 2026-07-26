import * as fs from 'node:fs';
import * as path from 'node:path';

import type { ExtractorConfig } from '@microsoft/api-extractor';
import { workspaceRoot } from '@nx/devkit';
import * as ts from 'typescript';

/**
 * ⚠️ SHARED SOURCE — this module exists byte identical in two places:
 *
 * - `tools/workspace-plugin/src/executors/generate-api/lib/dts-rollup.ts` (Nx `generate-api` executor, v9)
 * - `scripts/tasks/src/dts-rollup.ts` (legacy `just-scripts` api-extractor task, v8)
 *
 * It cannot be extracted into a shared library because `tools/workspace-plugin` must not depend on any
 * project within the monorepo - `tools/workspace-plugin/scripts/check-dep-graph.js` fails the build if it
 * does. The spec next to each copy asserts that the two never diverge.
 */

/**
 * The subset of {@link ExtractorConfig} that describes the `.d.ts` rollup outputs.
 *
 * Declared structurally so the guard can be exercised without constructing a full api-extractor config.
 */
export type DtsRollupConfig = Pick<
  ExtractorConfig,
  | 'projectFolder'
  | 'rollupEnabled'
  | 'untrimmedFilePath'
  | 'alphaTrimmedFilePath'
  | 'betaTrimmedFilePath'
  | 'publicTrimmedFilePath'
>;

type DtsRollupFilePathKey = Exclude<keyof DtsRollupConfig, 'projectFolder' | 'rollupEnabled'>;

/**
 * Every rollup variant api-extractor can emit, in the order violations are reported.
 */
const rollupFilePathKeys: readonly DtsRollupFilePathKey[] = [
  'untrimmedFilePath',
  'publicTrimmedFilePath',
  'betaTrimmedFilePath',
  'alphaTrimmedFilePath',
];

/**
 * Mirrors TypeScript's `isExternalModuleNameRelative`, which also accepts the Windows path separator.
 */
function isRelativeModuleSpecifier(moduleSpecifier: string): boolean {
  return moduleSpecifier === '.' || moduleSpecifier === '..' || /^\.\.?[/\\]/.test(moduleSpecifier);
}

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
 * The rollup is parsed with the TypeScript compiler instead of scanned with a regular expression so that
 * only real module specifiers are reported - a string literal *type* such as `'.'` or `'.2f'` is not a
 * module specifier and must not be flagged.
 *
 * @see https://github.com/microsoft/rushstack/issues/3335
 */
export function findRelativeImportsInDtsRollup(rollupContents: string): string[] {
  const sourceFile = ts.createSourceFile(
    'dts-rollup.d.ts',
    rollupContents,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ false,
    ts.ScriptKind.TS,
  );
  const moduleSpecifiers = new Set<string>();

  visit(sourceFile);

  return [...moduleSpecifiers];

  function visit(node: ts.Node): void {
    collectModuleSpecifier(node);
    ts.forEachChild(node, visit);
  }

  function collectModuleSpecifier(node: ts.Node): void {
    // `import ... from './module'`, `export ... from './module'`, `export * from './module'`
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addIfRelative(node.moduleSpecifier);
      return;
    }

    // `import('./module').Foo` - anywhere in a type position, exported or not
    if (ts.isImportTypeNode(node)) {
      addIfRelative(ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined);
      return;
    }

    // `import Foo = require('./module')`
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      addIfRelative(node.moduleReference.expression);
      return;
    }

    // `declare module './module' { ... }`
    if (ts.isModuleDeclaration(node)) {
      addIfRelative(node.name);
    }
  }

  function addIfRelative(node: ts.Node | undefined): void {
    if (!node || !ts.isStringLiteralLike(node)) {
      return;
    }

    if (isRelativeModuleSpecifier(node.text)) {
      moduleSpecifiers.add(node.text);
    }
  }
}

/**
 * Resolves every `.d.ts` rollup that api-extractor was configured to emit and that exists on disk.
 *
 * A single config can emit up to four variants (untrimmed + public/beta/alpha trimmed); variants that were
 * not configured are normalized to an empty path by api-extractor.
 */
export function getGeneratedDtsRollupPaths(extractorConfig: DtsRollupConfig): string[] {
  if (!extractorConfig.rollupEnabled) {
    return [];
  }

  const rollupPaths = new Set<string>();

  for (const key of rollupFilePathKeys) {
    const filePath = extractorConfig[key];

    if (filePath && fs.existsSync(filePath)) {
      rollupPaths.add(path.normalize(filePath));
    }
  }

  return [...rollupPaths];
}

/**
 * Fails when any generated `.d.ts` rollup imports a module that is not published alongside it.
 *
 * @param extractorConfig - the config api-extractor was invoked with
 * @param options - `scannedFilePaths` is shared across invocations within a single api-extractor run so
 * that a rollup emitted by more than one entry point config is parsed only once
 */
export function assertSelfContainedDtsRollups(
  extractorConfig: DtsRollupConfig,
  options: { scannedFilePaths?: Set<string> } = {},
): void {
  const { scannedFilePaths } = options;
  const violations: Array<{ filePath: string; moduleSpecifiers: string[] }> = [];

  for (const filePath of getGeneratedDtsRollupPaths(extractorConfig)) {
    if (scannedFilePaths?.has(filePath)) {
      continue;
    }
    scannedFilePaths?.add(filePath);

    const moduleSpecifiers = findRelativeImportsInDtsRollup(fs.readFileSync(filePath, 'utf-8'));

    if (moduleSpecifiers.length > 0) {
      violations.push({ filePath, moduleSpecifiers });
    }
  }

  if (violations.length === 0) {
    return;
  }

  throw new Error(
    [
      `api-extractor | BROKEN TYPE DECLARATION ROLLUP:`,
      ...violations.flatMap(violation => [
        `  ${path.relative(workspaceRoot, violation.filePath)} imports modules that are not published:`,
        ...violation.moduleSpecifiers.map(moduleSpecifier => `    - ${moduleSpecifier}`),
      ]),
      ``,
      `  This happens when declaration output references a type through an inline \`import('./module')\` type.`,
      `  🛠 FIX: annotate the affected export in ${path.relative(
        workspaceRoot,
        extractorConfig.projectFolder,
      )} with a statically imported type.`,
    ].join('\n'),
  );
}
