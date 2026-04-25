import { Divider } from '@fluentui/react-headless-components-preview';

import descriptionMd from './DividerDescription.md';

import { Default as DefaultStory } from './DividerDefault.stories';
// @ts-expect-error raw import
import defaultTailwindSource from './DividerDefault.stories.tsx?raw';
import { Vertical as VerticalStory } from './DividerVertical.stories';
// @ts-expect-error raw import
import verticalTailwindSource from './DividerVertical.stories.tsx?raw';

import { DefaultCss } from './DividerDefault.css';
// @ts-expect-error raw import
import defaultCssSource from './DividerDefault.css.tsx?raw';
// @ts-expect-error raw import
import defaultCssModuleSource from './DividerDefault.module.css?raw';

import { VerticalCss } from './DividerVertical.css';
// @ts-expect-error raw import
import verticalCssSource from './DividerVertical.css.tsx?raw';
// @ts-expect-error raw import
import verticalCssModuleSource from './DividerVertical.module.css?raw';

export const Default = DefaultStory;
Default.parameters = {
  ...Default.parameters,
  variants: {
    tailwind: {
      label: 'Tailwind',
      files: [{ name: 'DividerDefault.tsx', source: defaultTailwindSource }],
    },
    css: {
      label: 'CSS',
      component: DefaultCss,
      files: [
        { name: 'DividerDefault.tsx', source: defaultCssSource, language: 'tsx' },
        { name: 'DividerDefault.module.css', source: defaultCssModuleSource, language: 'css' },
      ],
    },
  },
};

export const Vertical = VerticalStory;
Vertical.parameters = {
  ...Vertical.parameters,
  variants: {
    tailwind: {
      label: 'Tailwind',
      files: [{ name: 'DividerVertical.tsx', source: verticalTailwindSource }],
    },
    css: {
      label: 'CSS',
      component: VerticalCss,
      files: [
        { name: 'DividerVertical.tsx', source: verticalCssSource, language: 'tsx' },
        { name: 'DividerVertical.module.css', source: verticalCssModuleSource, language: 'css' },
      ],
    },
  },
};

export default {
  title: 'Headless Components/Divider',
  component: Divider,
  parameters: {
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
