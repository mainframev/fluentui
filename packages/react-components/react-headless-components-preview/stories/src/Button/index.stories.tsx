import { Button } from '@fluentui/react-headless-components-preview';

import descriptionMd from './ButtonDescription.md';

import { Default as DefaultStory } from './ButtonDefault.stories';
// @ts-expect-error raw import
import defaultTailwindSource from './ButtonDefault.stories.tsx?raw';

import { DefaultCss } from './ButtonDefault.css';
// @ts-expect-error raw import
import cssComponentSource from './ButtonDefault.css.tsx?raw';

DefaultStory.parameters = {
  ...DefaultStory.parameters,
  headlessVariants: {
    tailwind: {
      source: defaultTailwindSource,
    },
    css: {
      component: DefaultCss,
      source: cssComponentSource,
    },
  },
};

export const Default = DefaultStory;

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
