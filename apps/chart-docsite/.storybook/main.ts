import type { StorybookConfig } from '@storybook/react-webpack5';
import * as webpack from 'webpack';
import { registerTsPaths } from '@fluentui/scripts-storybook';
import path from 'path';

// eslint-disable-next-line @nx/enforce-module-boundaries
import rootConfig from '../../../.storybook/main';

const tsConfigAllPath = path.join(__dirname, '../../../tsconfig.base.all.json');

const normalizeBase = (val?: string) => {
  let base = val || '/';
  // ensure leading slash
  if (!base.startsWith('/')) base = '/' + base;
  // ensure trailing slash
  if (!base.endsWith('/')) base = base + '/';
  return base;
};

const withPublicPath = (cfg: webpack.Configuration) => {
  const base = normalizeBase(process.env.STORYBOOK_BASE);
  cfg.output = cfg.output || {};
  cfg.output.publicPath = base;
  return cfg;
};

const config = {
  ...rootConfig,
  stories: [
    // docsite stories
    '../src/**/*.mdx',
    '../src/**/index.stories.@(js|jsx|ts|tsx)',
    // packages stories
    '../../../packages/charts/react-charts/stories/**/index.stories.@(js|jsx|ts|tsx)',
  ],
  webpackFinal: (cfg, { configType }) => {
    if (configType === 'PRODUCTION') {
      cfg = withPublicPath(cfg);
    }

    registerTsPaths({ configFile: tsConfigAllPath, config: cfg });
    return cfg;
  },
  managerHead: (head, { configType }) => {
    const base = normalizeBase(process.env.STORYBOOK_BASE);
    const injections = [
      `<link rel="shortcut icon" type="image/x-icon" href="${base}favicon.ico">`,
      `<script>window.PREVIEW_URL = '${base}iframe.html'</script>`,
    ];
    return configType === 'PRODUCTION' ? `${head}${injections.join('')}` : head;
  },
  managerWebpack: (cfg, { configType }) => {
    if (configType === 'PRODUCTION') {
      cfg = withPublicPath(cfg);
    }

    return cfg;
  },
} satisfies StorybookConfig;

export default config;
