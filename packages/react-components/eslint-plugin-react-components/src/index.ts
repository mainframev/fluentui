import type { ESLint } from 'eslint';

import { name, version } from '../package.json';
import {
  RULE_NAME as enforceUseClientName,
  rule as enforceUseClient,
  type RuleOptions,
} from './rules/enforce-use-client';
import { RULE_NAME as preferFluentUIV9Name, rule as preferFluentUIV9 } from './rules/prefer-fluentui-v9';

// `RuleOptions` is part of the shipped `rules` signature, so it has to be imported statically and re-exported
// from the entry point, otherwise declaration emit references it through an inline `import()` type that
// API Extractor rolls up as an import of a module that is not published.
export type { RuleOptions };

export const meta = {
  name,
  version,
};
export const rules = {
  [enforceUseClientName]: enforceUseClient,
  [preferFluentUIV9Name]: preferFluentUIV9,
};

const recommendedRules = {
  // Add rules to the recommended config here in the future
};

// The index signature must be explicit: TypeScript >=6 preserves computed property names in declaration
// output, which would emit an unusable `[name]` key and a dangling `../package.json` import in `.d.ts`.
const flatRecommendedPlugins: { [pluginName: string]: ESLint.Plugin } = {
  // Define plugins as an object to satisfy ESLint v9 flat config format
  // the actual plugin will be assigned later to avoid circular dependencies
  [name]: {} as ESLint.Plugin,
};

export const configs = {
  recommended: {
    plugins: [name],
    rules: recommendedRules,
  },
  'flat/recommended': {
    plugins: flatRecommendedPlugins,
    rules: recommendedRules,
  },
};

const plugin = {
  meta,
  configs,
  rules,
};

// Flat config for eslint v9
configs['flat/recommended'].plugins = {
  [name]: plugin as unknown as ESLint.Plugin,
};

module.exports = plugin;
