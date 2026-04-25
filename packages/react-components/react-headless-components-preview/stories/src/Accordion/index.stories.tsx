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
// @ts-expect-error raw import
import defaultCssModuleSource from './AccordionDefault.module.css?raw';

import { CollapsibleCss } from './AccordionCollapsible.css';
// @ts-expect-error raw import
import collapsibleCssSource from './AccordionCollapsible.css.tsx?raw';
// @ts-expect-error raw import
import collapsibleCssModuleSource from './AccordionCollapsible.module.css?raw';

export const Default = DefaultStory;
Default.parameters = {
  ...Default.parameters,
  variants: {
    tailwind: {
      label: 'Tailwind',
      files: [{ name: 'AccordionDefault.tsx', source: defaultTailwindSource }],
    },
    css: {
      label: 'CSS',
      component: DefaultCss,
      files: [
        { name: 'AccordionDefault.tsx', source: defaultCssSource, language: 'tsx' },
        { name: 'AccordionDefault.module.css', source: defaultCssModuleSource, language: 'css' },
      ],
    },
  },
};

export const Collapsible = CollapsibleStory;
Collapsible.parameters = {
  ...Collapsible.parameters,
  variants: {
    tailwind: {
      label: 'Tailwind',
      files: [{ name: 'AccordionCollapsible.tsx', source: collapsibleTailwindSource }],
    },
    css: {
      label: 'CSS',
      component: CollapsibleCss,
      files: [
        { name: 'AccordionCollapsible.tsx', source: collapsibleCssSource, language: 'tsx' },
        { name: 'AccordionCollapsible.module.css', source: collapsibleCssModuleSource, language: 'css' },
      ],
    },
  },
};

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
