import type { Configuration } from 'webpack';

export type BaseConfig = Cypress.ConfigOptions & {
  component: Cypress.Config['component'] & {
    devServer: {
      bundler: 'webpack';
      framework: 'react';
      webpackConfig: Configuration;
    };
  };
};

export declare const baseConfig: BaseConfig;
export declare const baseWebpackConfig: Configuration;

// =========== TS PATH ALIASES ==================

export declare const readWorkspacePathAliases: typeof import('./ts-paths').readWorkspacePathAliases;

// =========== BROWSER APIs ==================

// TODO: Browser related APIs should be exposed via export maps or moved to separate package
// Expose Browser specific API under same barrel
export declare const mount: typeof import('./browser').mount;
