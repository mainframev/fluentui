import { findRelativeImportsInDtsRollup } from './api-extractor';

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

  it(`should report relative imports produced from inline import() types`, () => {
    const rollup = [
      `import { BreadcrumbProps as BreadcrumbProps_2 } from './Breadcrumb.types';`,
      `import type { ButtonProps } from '@fluentui/react-button';`,
      `import { FieldState as FieldState_2 } from '..';`,
      ``,
      `export declare const BreadcrumbProvider: React_2.Provider<BreadcrumbProps_2 | undefined>;`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./Breadcrumb.types', '..']);
  });

  it(`should report relative re-exports and deduplicate specifiers`, () => {
    const rollup = [
      `export { RuleOptions } from './rules/enforce-use-client';`,
      `export type { RuleOptions as RuleOptions_2 } from './rules/enforce-use-client';`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual(['./rules/enforce-use-client']);
  });

  it(`should not report package specifiers that merely contain a dot`, () => {
    const rollup = [
      `import { compiler } from 'markdown-to-jsx';`,
      `import type { Options } from '@fluentui/react-utilities';`,
      `import prettier from 'prettier/parser-html.js';`,
    ].join('\n');

    expect(findRelativeImportsInDtsRollup(rollup)).toEqual([]);
  });
});
