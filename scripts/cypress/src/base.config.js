// @ts-check

/**
 * Shared Cypress Component Testing configuration.
 *
 * NOTE: this module is authored in JavaScript on purpose. Cypress loads the config file in a child
 * process where it registers its own bundled `ts-node` with a hardcoded `moduleResolution: 'node'`
 * (node10), which TypeScript 6 rejects with TS5107. Every TypeScript file reachable from a
 * `cypress.config.*` therefore fails to load, so the whole Node side of the Cypress setup - the
 * config files and this module - is plain CommonJS checked with `// @ts-check`.
 */

const crypto = require('node:crypto');
const path = require('node:path');

const { defineConfig } = require('cypress');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

const { readWorkspacePathAliases } = require('./ts-paths');

/**
 * @import { Configuration } from 'webpack';
 */

/**
 * `./index` (this package's public type entry point, `src/index.d.ts`) is the single source of truth
 * for `BaseConfig` - re-declaring its shape here would let the two drift apart.
 * @typedef {import('./index').BaseConfig} BaseConfig
 */

const workspaceRoot = path.resolve(__dirname, '../../..');
const workspaceTsConfigPath = path.join(workspaceRoot, 'tsconfig.base.json');

const projectRoot = process.cwd();

// Use a high port range unlikely to collide with other services: 20000-29999
const deterministicPort = 20000 + (hashToInt(projectRoot) % 10000);

/**
 * @type {Configuration}
 */
const baseWebpackConfig = {
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  mode: 'development',
  devtool: 'eval',
  // Ensure parallel Cypress component runs don't collide on a fixed port (8080 is webpack-dev-server default).
  // Pick a deterministic port per project (can be overridden) since some CI setups ignore 'auto'.
  // @ts-expect-error - devServer is provided by webpack-dev-server typings
  devServer: {
    port: process.env.WEBPACK_DEV_SERVER_PORT ? Number(process.env.WEBPACK_DEV_SERVER_PORT) : deterministicPort,
    host: '127.0.0.1',
  },
  output: {
    publicPath: '/',
    chunkFilename: '[name].bundle.js',
  },
  module: {
    rules: [],
  },
};

/**
 * @returns {Configuration}
 */
const cypressWebpackConfig = () => {
  if (baseWebpackConfig.module) {
    baseWebpackConfig.module.rules?.push({
      test: /\.(ts|tsx)$/,
      loader: 'esbuild-loader',
      options: {
        tsconfig: './tsconfig.cy.json',
      },
    });
  }

  // TODO: remove this once esbuild-loader properly handles module loading https://github.com/privatenumber/esbuild-loader/issues/343#issuecomment-1845836603
  baseWebpackConfig.ignoreWarnings = [
    ...(baseWebpackConfig.ignoreWarnings ?? []),
    {
      module: /[esbuild-loader]/,
      message:
        /The specified tsconfig at\s+"[/a-z0-9-/.\s]+"\s+was applied to the file\s+"[/a-z0-9-.\s]+"\s+but does not match its "include" patterns/i,
    },
  ];

  baseWebpackConfig.resolve ??= {};
  baseWebpackConfig.resolve.plugins ??= [];
  baseWebpackConfig.resolve.plugins.push(
    new TsconfigPathsPlugin({
      configFile: workspaceTsConfigPath,
      // explicit, because the aliases are `pathsBasePath` relative - see `./ts-paths`
      baseUrl: readWorkspacePathAliases(workspaceTsConfigPath).absoluteBaseUrl,
    }),
  );

  return baseWebpackConfig;
};

/**
 * Programmatically create relative support support path, because Cypress bug
 * @see https://github.com/cypress-io/cypress/issues/31819
 *
 * This is a workaround for the issue where Cypress does not resolve the paths correctly, as it
 * internally prepend the __dirname, making them invalid
 *
 */
const sharedConfigSupportRootDir = path.join(__dirname, './support');
const projectSupportDir = path.relative(projectRoot, sharedConfigSupportRootDir);

const baseConfig = /** @type {BaseConfig} */ (
  defineConfig({
    video: false,
    component: {
      specPattern: [path.join(projectRoot, '**/*.e2e.tsx'), path.join(projectRoot, '**/*.cy.tsx')],
      devServer: {
        framework: 'react',
        bundler: 'webpack',
        webpackConfig: cypressWebpackConfig(),
      },
      supportFile: path.join(projectSupportDir, './component.js'),
      indexHtmlFile: path.join(projectSupportDir, './component-index.html'),
      defaultCommandTimeout: 8000,
    },
    retries: {
      runMode: 4,
      openMode: 0,
    },
    // Screenshots go under <pkg>/cypress/screenshots and can be useful to look at after failures in
    // local headless runs (especially if the failure is specific to headless runs)
    // screenshotOnRunFailure: isLocalRun && argv.mode === 'run',
    fixturesFolder: path.join(__dirname, './fixtures'),
  })
);

/**
 * use this as base webpack config if you need to customize devServer webpack configuration
 *
 * Generate a deterministic, project-scoped port to avoid collisions when multiple Cypress component
 * test servers start in parallel on the same machine/agent. Allows override via WEBPACK_DEV_SERVER_PORT.
 *
 * @param {string} str
 */
function hashToInt(str) {
  // Use Node.js crypto module for better hashing
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  // Convert first 8 hex characters to integer
  return parseInt(hash.slice(0, 8), 16);
}

module.exports = { baseConfig, baseWebpackConfig };
