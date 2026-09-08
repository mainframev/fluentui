import type { SlotDataAttributes } from '../../utils';
import type { AccordionState } from './Accordion.types';

/** Data attribute names for Accordion slots. */
export const accordionDataAttributes = {
  root: {
    collapsible: 'data-collapsible',
    multiple: 'data-multiple',
  },
} as const satisfies SlotDataAttributes<AccordionState>;
