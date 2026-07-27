// @ts-check

const path = require('node:path');

const { baseConfig } = require('@fluentui/scripts-cypress');
const { registerTsPaths } = require('@fluentui/scripts-storybook');

const tsConfigPath = path.resolve(__dirname, '../../tsconfig.base.v8.json');

const config = { ...baseConfig };

registerTsPaths({ config: config.component.devServer.webpackConfig, configFile: tsConfigPath });

module.exports = config;
