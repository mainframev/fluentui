// @ts-check
const fluentPlugin = require('@fluentui/eslint-plugin');

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  ...fluentPlugin.configs['flat/react-legacy'],
  {
    rules: {
      'import/no-webpack-loader-syntax': 'off',
      'no-alert': 'off',
      'no-restricted-globals': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    // type aware rules are only wired up for TypeScript sources - `cypress.config.js` and friends
    // are plain JavaScript and have no `parserOptions.project`
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
  {
    files: ['**/*.Example.{ts,tsx}'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
