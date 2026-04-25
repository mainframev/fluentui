const rootMain = require('../../../.storybook/main');
const { loadWorkspaceAddon } = require('@fluentui/scripts-storybook');
const path = require('path');

module.exports = /** @type {Omit<import('../../../.storybook/main'), 'typescript'|'babel'>} */ ({
  ...rootMain,
  stories: [
    ...rootMain.stories,
    // docsite stories
    '../src/**/*.mdx',
    '../src/**/index.stories.@(ts|tsx)',
    // headless package stories
    '../../../packages/react-components/react-headless-components-preview/stories/src/**/index.stories.@(ts|tsx)',
  ],
  staticDirs: ['../public'],
  addons: [
    ...rootMain.addons,
    loadWorkspaceAddon('@fluentui/react-storybook-addon-variants', {
      tsConfigPath: path.resolve(__dirname, '../../../tsconfig.base.json'),
    }),
  ],
  build: {
    previewUrl: process.env.DEPLOY_PATH,
  },
  webpackFinal: (config, options) => {
    const localConfig = /** @type config */ ({ ...rootMain.webpackFinal(config, options) });

    // Ensure ?raw imports bypass all other loaders/transforms by excluding
    // the ?raw resourceQuery from every rule that matches files. Without this,
    // rules like SWC (TSX -> JS) and the export-to-sandbox addon process .stories.tsx
    // files even when imported via ?raw, so the "raw" string is actually compiled JS.
    const excludeRawQuery = rule => {
      if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return;
      const hasFileMatcher = rule.test || rule.include;
      if (hasFileMatcher && rule.resourceQuery === undefined && !rule.oneOf) {
        rule.resourceQuery = { not: [/raw/] };
      }
      if (Array.isArray(rule.oneOf)) rule.oneOf.forEach(excludeRawQuery);
      if (Array.isArray(rule.rules)) rule.rules.forEach(excludeRawQuery);
    };
    if (Array.isArray(localConfig.module?.rules)) {
      localConfig.module.rules.forEach(excludeRawQuery);
    }

    // Enable ?raw imports for capturing file contents as strings
    localConfig.module.rules.push({
      resourceQuery: /raw/,
      type: 'asset/source',
    });

    return localConfig;
  },
});
