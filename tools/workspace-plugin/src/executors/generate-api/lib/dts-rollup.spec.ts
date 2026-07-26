import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { workspaceRoot } from '@nx/devkit';

import {
  type DtsRollupConfig,
  assertSelfContainedDtsRollups,
  findRelativeImportsInDtsRollup,
  getGeneratedDtsRollupPaths,
} from './dts-rollup';

/**
 * ⚠️ SHARED SOURCE — this spec exists byte identical next to both copies of `dts-rollup.ts`.
 * See the module doc comment in `dts-rollup.ts` for why the module cannot be extracted into a library.
 */

describe(`shared source parity`, () => {
  const sharedSources = [
    ['tools/workspace-plugin/src/executors/generate-api/lib/dts-rollup.ts', 'scripts/tasks/src/dts-rollup.ts'],
    [
      'tools/workspace-plugin/src/executors/generate-api/lib/dts-rollup.spec.ts',
      'scripts/tasks/src/dts-rollup.spec.ts',
    ],
  ] as const;

  it.each(sharedSources)(`'%s' should stay byte identical with '%s'`, (a, b) => {
    expect(readFileSync(join(workspaceRoot, a), 'utf-8')).toEqual(readFileSync(join(workspaceRoot, b), 'utf-8'));
  });
});

describe(`findRelativeImportsInDtsRollup`, () => {
  it(`should return no violations for a self contained rollup`, () => {
    const rollup = [
      `import type { ESLint } from 'eslint';`,
      `import { RuleModule } from '@typescript-eslint/utils/ts-eslint';`,
      `import * as React_2 from 'react';`,
      ``,
      `export declare const Overflow: React_2.ForwardRefExoticComponent<OverflowProps>;`,
      ``,
      `export { }`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual([]);
  });

  it(`should report relative static imports`, () => {
    const rollup = [
      `import { BreadcrumbProps as BreadcrumbProps_2 } from './Breadcrumb.types';`,
      `import type { ButtonProps } from '@fluentui/react-button';`,
      `import { FieldState as FieldState_2 } from '..';`,
      `import defaultExport from '.';`,
      `import '../side-effect';`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./Breadcrumb.types', '..', '.', '../side-effect']);
  });

  it(`should report relative re-exports and deduplicate specifiers`, () => {
    const rollup = [
      `export { RuleOptions } from './rules/enforce-use-client';`,
      `export type { RuleOptions as RuleOptions_2 } from './rules/enforce-use-client';`,
      `export * from './rules/enforce-use-client';`,
      `export * as rules from './rules';`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./rules/enforce-use-client', './rules']);
  });

  it(`should report inline import() types on exported declarations`, () => {
    const rollup = [
      `export declare const BreadcrumbProvider: Provider<import('./Breadcrumb.types').BreadcrumbProps | undefined>;`,
      `export declare function useField(): import("./contexts/FieldContext").FieldState;`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./Breadcrumb.types', './contexts/FieldContext']);
  });

  it(`should report inline import() types on declarations that are not exported`, () => {
    const rollup = [
      `declare const internalContext: import('./internal/Context').ContextValue;`,
      `declare type Internal = {`,
      `    nested: Array<import('../shared/types').Shared>;`,
      `};`,
      `export { }`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./internal/Context', '../shared/types']);
  });

  it(`should report relative specifiers spread over multiple lines`, () => {
    const rollup = [
      `import {`,
      `    OverflowItemProps,`,
      `    OverflowProps`,
      `} from './Overflow.types';`,
      ``,
      `export declare const useOverflow: () => import(`,
      `    '../hooks/useOverflowContext'`,
      `).OverflowContextValue;`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./Overflow.types', '../hooks/useOverflowContext']);
  });

  it(`should report 'import x = require()' specifiers`, () => {
    const rollup = [`import legacy = require('./legacy');`, `import external = require('lodash');`].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./legacy']);
  });

  it(`should report relative module augmentations`, () => {
    const rollup = [
      `declare module './augmented' {`,
      `    interface Extra { }`,
      `}`,
      `declare module '@fluentui/react-theme' {`,
      `    interface Theme { }`,
      `}`,
      `declare module Namespaced { }`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./augmented']);
  });

  it(`should report specifiers that use the Windows path separator`, () => {
    const rollup = [
      String.raw`import { Foo } from '.\\Foo.types';`,
      String.raw`export declare const bar: import('..\\shared\\types').Bar;`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual([String.raw`.\Foo.types`, String.raw`..\shared\types`]);
  });

  it(`should not report package or absolute specifiers`, () => {
    const rollup = [
      `import { compiler } from 'markdown-to-jsx';`,
      `import type { Options } from '@fluentui/react-utilities';`,
      `import prettier from 'prettier/parser-html.js';`,
      `import node from 'node:path';`,
      `import absolute from '/opt/generated/types';`,
      `export declare const theme: import('@fluentui/react-theme').Theme;`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual([]);
  });

  it(`should not report string literal types that look like relative specifiers`, () => {
    const rollup = [
      `export declare const numberFormat: '.2f';`,
      `export declare type Separator = '.' | '..' | './';`,
      `export declare function format(spec: '.2f' | '.0%'): string;`,
      `export declare const from: "from './types'";`,
      `export declare const doc: {`,
      `    value: '../not-an-import';`,
      `};`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual([]);
  });

  it(`should not report relative specifiers that only appear inside comments`, () => {
    const rollup = [
      `/**`,
      ` * @example`,
      ` * import { Foo } from './types';`,
      ` */`,
      `export declare const Foo: number;`,
      `// export * from '../internal';`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual([]);
  });
});

describe(`getGeneratedDtsRollupPaths / assertSelfContainedDtsRollups`, () => {
  const fixturesRootDir = join(__dirname, '__fixtures__', 'dts-rollup');
  let projectFolder: string;

  const selfContained = `export declare const Foo: number;\nexport { }\n`;
  const broken = `export declare const Foo: import('./types').Foo;\nexport { }\n`;

  function createConfig(overrides: Partial<DtsRollupConfig> = {}): DtsRollupConfig {
    return {
      projectFolder,
      rollupEnabled: true,
      untrimmedFilePath: '',
      alphaTrimmedFilePath: '',
      betaTrimmedFilePath: '',
      publicTrimmedFilePath: '',
      ...overrides,
    };
  }

  function writeRollup(fileName: string, contents: string) {
    const filePath = join(projectFolder, fileName);
    writeFileSync(filePath, contents, 'utf-8');
    return filePath;
  }

  beforeEach(() => {
    mkdirSync(fixturesRootDir, { recursive: true });
    projectFolder = mkdtempSync(join(fixturesRootDir, 'proj-'));
  });

  afterEach(() => {
    rmSync(fixturesRootDir, { recursive: true, force: true });
  });

  it(`should return no paths when the rollup is disabled`, () => {
    const untrimmedFilePath = writeRollup('index.d.ts', broken);
    const config = createConfig({ rollupEnabled: false, untrimmedFilePath });

    expect(getGeneratedDtsRollupPaths(config)).toEqual([]);
    expect(() => assertSelfContainedDtsRollups(config)).not.toThrow();
  });

  it(`should skip configured rollups that were not emitted`, () => {
    const config = createConfig({ untrimmedFilePath: join(projectFolder, 'missing.d.ts') });

    expect(getGeneratedDtsRollupPaths(config)).toEqual([]);
    expect(() => assertSelfContainedDtsRollups(config)).not.toThrow();
  });

  it(`should collect every enabled rollup variant that exists`, () => {
    const config = createConfig({
      untrimmedFilePath: writeRollup('index.d.ts', selfContained),
      publicTrimmedFilePath: writeRollup('index.public.d.ts', selfContained),
      betaTrimmedFilePath: writeRollup('index.beta.d.ts', selfContained),
      alphaTrimmedFilePath: join(projectFolder, 'index.alpha.d.ts'),
    });

    expect(getGeneratedDtsRollupPaths(config)).toEqual([
      join(projectFolder, 'index.d.ts'),
      join(projectFolder, 'index.public.d.ts'),
      join(projectFolder, 'index.beta.d.ts'),
    ]);
    expect(() => assertSelfContainedDtsRollups(config)).not.toThrow();
  });

  it(`should throw for a trimmed rollup even when the untrimmed rollup is self contained`, () => {
    const config = createConfig({
      untrimmedFilePath: writeRollup('index.d.ts', selfContained),
      publicTrimmedFilePath: writeRollup('index.public.d.ts', broken),
    });

    expect(() => assertSelfContainedDtsRollups(config)).toThrow(/index\.public\.d\.ts imports modules/);
    expect(() => assertSelfContainedDtsRollups(config)).toThrow(/- \.\/types/);
  });

  it(`should report every violating rollup variant in a single error`, () => {
    const config = createConfig({
      untrimmedFilePath: writeRollup('index.d.ts', broken),
      betaTrimmedFilePath: writeRollup('index.beta.d.ts', broken),
    });

    let message = '';
    try {
      assertSelfContainedDtsRollups(config);
    } catch (err) {
      message = (err as Error).message;
    }

    expect(message).toContain('index.d.ts imports modules');
    expect(message).toContain('index.beta.d.ts imports modules');
  });

  it(`should not scan the same rollup twice within one run`, () => {
    const untrimmedFilePath = writeRollup('index.d.ts', broken);
    const scannedFilePaths = new Set<string>();
    const config = createConfig({ untrimmedFilePath });

    expect(() => assertSelfContainedDtsRollups(config, { scannedFilePaths })).toThrow(/BROKEN TYPE DECLARATION ROLLUP/);
    expect(scannedFilePaths).toEqual(new Set([untrimmedFilePath]));

    // a second entry point config emitting the same rollup is a no-op
    expect(() => assertSelfContainedDtsRollups(config, { scannedFilePaths })).not.toThrow();
  });
});
