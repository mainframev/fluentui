import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from '@fluentui/react-headless-components-preview';

import descriptionMd from './AccordionDescription.md';

import { Default as DefaultStory } from './AccordionDefault.stories';
// @ts-expect-error raw import
import defaultTailwindSource from './AccordionDefault.stories.tsx?raw';
import { Collapsible as CollapsibleStory } from './AccordionCollapsible.stories';
// @ts-expect-error raw import
import collapsibleTailwindSource from './AccordionCollapsible.stories.tsx?raw';

import { DefaultCss } from './AccordionDefault.css';
// @ts-expect-error raw import
import defaultCssSource from './AccordionDefault.css.tsx?raw';

import { CollapsibleCss } from './AccordionCollapsible.css';
// @ts-expect-error raw import
import collapsibleCssSource from './AccordionCollapsible.css.tsx?raw';

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

CollapsibleStory.parameters = {
  ...CollapsibleStory.parameters,
  headlessVariants: {
    tailwind: {
      source: collapsibleTailwindSource,
    },
    css: {
      component: CollapsibleCss,
      source: collapsibleCssSource,
    },
  },
};

export const Default = DefaultStory;
export const Collapsible = CollapsibleStory;

export default {
  title: 'Headless Components/Accordion',
  component: Accordion,
  subcomponents: { AccordionHeader, AccordionItem, AccordionPanel },
  parameters: {
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
