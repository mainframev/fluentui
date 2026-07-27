// @ts-check

const { baseConfig, baseWebpackConfig } = require('@fluentui/scripts-cypress');
const { createStorybookWebpackConfig } = require('@fluentui/scripts-webpack');

const config = { ...baseConfig };
const v8webpackConfig = createStorybookWebpackConfig(baseWebpackConfig);

// we need to remove scripts-cypress from aliases as we wanna keep node_modules resolution to make
// browser path work for `import { mount } from '@fluentui/scripts-cypress';`
config.component.devServer.webpackConfig = removeAliases(v8webpackConfig, [
  '@fluentui/scripts-cypress/',
  '@fluentui/scripts-cypress$',
]);

module.exports = config;

/**
 * @param {typeof v8webpackConfig} webpackConfig
 * @param {string[]} aliases
 */
function removeAliases(webpackConfig, aliases) {
  const alias = webpackConfig?.resolve?.alias ?? {};

  for (const key of Object.keys(alias)) {
    if (aliases.includes(key)) {
      delete (/** @type {Record<string, unknown>} */ (alias)[key]);
    }
  }

  return webpackConfig;
}
