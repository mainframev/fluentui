import { fileURLToPath } from 'node:url';

import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import mdx from 'fumadocs-mdx/vite';
import { defineConfig, type UserConfig } from 'vite';

import * as MdxConfig from './source.config.js';
import { hostingBase } from './deployment.config.js';
import { fullSource } from './vite-plugins/full-source.js';
import { markdownAsString } from './vite-plugins/markdown-as-string.js';
import { scopeStoryGlobals } from './vite-plugins/scope-story-globals.js';
import { storyOrder } from './vite-plugins/story-order.js';
import { tsconfigAliases } from './vite-plugins/tsconfig-aliases.js';

const require = (await import('node:module')).createRequire(import.meta.url);
const { getImportMappingsForExportToSandboxAddon } = require('@fluentui/scripts-storybook');

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(
  async (): Promise<UserConfig> => ({
    base: hostingBase,
    build: {
      assetsDir: 'docs/assets',
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') {
            return;
          }

          defaultHandler(warning);
        },
      },
    },
    ssr: {
      noExternal: [/^@fluentui\//, 'tabster', 'keyborg'],
    },
    resolve: {
      alias: [
        {
          find: /^@repo\/(.*)$/,
          replacement: `${repoRoot}$1`,
        },
        ...tsconfigAliases(`${repoRoot}tsconfig.base.json`, repoRoot),
      ],
    },
    plugins: [
      markdownAsString(),
      scopeStoryGlobals(),
      storyOrder(),
      fullSource({
        importMappings: getImportMappingsForExportToSandboxAddon(),
        cssModules: {
          tokensFilePath: `${repoRoot}packages/react-components/react-headless-components-preview/stories/.storybook/tokens.css`,
        },
      }),
      await mdx(MdxConfig),
      tailwindcss(),
      reactRouter(),
    ],
  }),
);
