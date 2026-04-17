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

import { VerticalCss } from './DividerVertical.css';
// @ts-expect-error raw import
import verticalCssSource from './DividerVertical.css.tsx?raw';

DefaultStory.parameters = {
  ...DefaultStory.parameters,
  headlessVariants: {
    tailwind: {
      source: defaultTailwindSource,
    },
    css: {
      component: DefaultCss,
      source: defaultCssSource,
    },
  },
};

VerticalStory.parameters = {
  ...VerticalStory.parameters,
  headlessVariants: {
    tailwind: {
      source: verticalTailwindSource,
    },
    css: {
      component: VerticalCss,
      source: verticalCssSource,
    },
  },
};

export const Default = DefaultStory;
export const Vertical = VerticalStory;

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
