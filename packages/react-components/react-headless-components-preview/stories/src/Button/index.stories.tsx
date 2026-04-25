import { Button } from '@fluentui/react-headless-components-preview';

import descriptionMd from './ButtonDescription.md';

import { Default as DefaultStory } from './ButtonDefault.stories';
// @ts-expect-error raw import
import defaultTailwindSource from './ButtonDefault.stories.tsx?raw';

import { DefaultCss } from './ButtonDefault.css';
// @ts-expect-error raw import
import defaultCssSource from './ButtonDefault.css.tsx?raw';
// @ts-expect-error raw import
import defaultCssModuleSource from './ButtonDefault.module.css?raw';

export const Default = DefaultStory;
Default.parameters = {
  ...Default.parameters,
  variants: {
    tailwind: {
      label: 'Tailwind',
      files: [{ name: 'ButtonDefault.tsx', source: defaultTailwindSource }],
    },
    css: {
      label: 'CSS',
      component: DefaultCss,
      files: [
        { name: 'ButtonDefault.tsx', source: defaultCssSource, language: 'tsx' },
        { name: 'ButtonDefault.module.css', source: defaultCssModuleSource, language: 'css' },
      ],
    },
  },
};

export default {
  title: 'Headless Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
