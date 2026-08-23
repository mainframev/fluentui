// @ts-check

const path = require('node:path');

const { baseConfig, readWorkspacePathAliases } = require('@fluentui/scripts-cypress');
const { registerTsPaths } = require('@fluentui/scripts-storybook');

const tsConfigPath = path.resolve(__dirname, '../../tsconfig.base.v8.json');

const config = { ...baseConfig };

registerTsPaths({
  config: config.component.devServer.webpackConfig,
  configFile: tsConfigPath,
  // explicit, because the aliases are `pathsBasePath` relative - see `@fluentui/scripts-cypress`'s
  // `ts-paths.js`. Without it `TsconfigPathsPlugin` falls back to anchoring `paths` at the directory of
  // `tsConfigPath` itself, which is only correct here as long as `tsconfig.base.v8.json` declares its
  // `paths` directly rather than through an `extends` chain.
  baseUrl: readWorkspacePathAliases(tsConfigPath).absoluteBaseUrl,
});

module.exports = config;
