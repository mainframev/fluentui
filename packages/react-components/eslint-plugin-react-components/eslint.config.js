// @ts-check
const fluentPlugin = require('@fluentui/eslint-plugin');

module.exports = [
  ...fluentPlugin.configs['flat/node'],
  {
    files: ['**/src/**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
];
