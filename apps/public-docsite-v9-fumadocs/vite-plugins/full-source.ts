import type { Plugin } from 'vite';
import { createRequire } from 'node:module';

import * as babel from '@babel/core';

const require = createRequire(import.meta.url);
const sourcePlugin = require.resolve('@fluentui/babel-preset-storybook-full-source');

const STORY_FILE = /\.stories\.(?:jsx?|tsx?)$/;

export interface FullSourceOptions {
  importMappings: Record<string, { replace: string }>;
  cssModules?: boolean | { tokensFilePath?: string };
}

/**
 * Attaches `parameters.fullSource` (and `parameters.cssModuleSources`) to every story
 * export, by running the same babel plugin Storybook runs (design D2).
 *
 * Unlike the Storybook webpack rule, babel is invoked here with *only* this plugin, so
 * there is no need to strip the Griffel/v9 presets first — this is a pure AST-inject
 * pass that leaves TS/JSX intact for esbuild to transpile afterwards.
 */
export function fullSource(options: FullSourceOptions): Plugin {
  return {
    name: 'fluentui:full-source',
    enforce: 'pre',

    async transform(code, id) {
      const [filename] = id.split('?');

      if (!STORY_FILE.test(filename)) {
        return null;
      }

      const result = await babel.transformAsync(code, {
        filename,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        compact: false,
        retainLines: true,
        parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: [[sourcePlugin, { ...options, storyGranularity: 'story' }]],
      });

      if (!result?.code) {
        return null;
      }

      return { code: result.code, map: result.map };
    },
  };
}
