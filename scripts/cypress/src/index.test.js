// @ts-nocheck
// This file intentionally opts out of `checkJs` (unlike every other module in this package): it
// `require`s `./index`, whose sibling `./index.d.ts` re-exports `BaseConfig` (a `Cypress.ConfigOptions`
// derivative). Pulling that ambient `Cypress` global into the same TS program as this project's
// `tsconfig.spec.json` (`@types/jest`) collides two ambient `Assertion`/`expect` globals - the same
// conflict `tsconfig.spec.json` already works around by excluding `src/index.d.ts` itself. Runtime
// behavior (what this file actually tests) is unaffected by `@ts-nocheck`.

const index = require('./index');

describe('@fluentui/scripts-cypress public entry point', () => {
  it('exposes baseConfig and baseWebpackConfig from ./base.config', () => {
    expect(index.baseConfig).toBeDefined();
    expect(index.baseConfig.component).toBeDefined();
    expect(index.baseWebpackConfig).toBeDefined();
  });

  it('exposes readWorkspacePathAliases from ./ts-paths, so consumers do not need a deep import', () => {
    // `apps/rit-tests-v8/cypress.config.js` (and any future caller that needs to thread an explicit
    // `baseUrl` into `@fluentui/scripts-storybook`'s `registerTsPaths`) relies on this being part of
    // the package's public surface rather than reaching into `@fluentui/scripts-cypress/src/ts-paths`.
    expect(typeof index.readWorkspacePathAliases).toBe('function');

    const result = index.readWorkspacePathAliases(
      require('node:path').resolve(__dirname, '../../../tsconfig.base.json'),
    );
    expect(typeof result.absoluteBaseUrl).toBe('string');
  });
});
