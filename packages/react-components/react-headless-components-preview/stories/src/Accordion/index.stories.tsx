import {
  Accordion,
  accordionDataAttributes,
  AccordionHeader,
  accordionHeaderDataAttributes,
  AccordionItem,
  accordionItemDataAttributes,
  AccordionPanel,
  accordionPanelDataAttributes,
} from '@fluentui/react-headless-components-preview/accordion';

import descriptionMd from './AccordionDescription.md';
export { Default } from './AccordionDefault.stories';
export { Collapsible } from './AccordionCollapsible.stories';

export default {
  title: 'Components/Accordion',
  component: Accordion,
  subcomponents: { AccordionHeader, AccordionItem, AccordionPanel },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            Accordion: { attributes: accordionDataAttributes },
            AccordionHeader: {
              attributes: accordionHeaderDataAttributes,
              values: { root: { expandIconPosition: ['start', 'end'] } },
            },
            AccordionItem: { attributes: accordionItemDataAttributes },
            AccordionPanel: { attributes: accordionPanelDataAttributes },
          },
        },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
