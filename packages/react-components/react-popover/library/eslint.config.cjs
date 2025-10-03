const fluent = require('@fluentui/eslint-plugin');

module.exports = [
  ...fluent.configs['flat/react'],
  {
    files: ['**/*.{ts,tsx}'],
    rules: {},
  },
];
