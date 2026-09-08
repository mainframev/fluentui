import type { SlotDataAttributes } from '../../../utils';
import type { AccordionItemState } from './AccordionItem.types';

/** Data attribute names for AccordionItem slots. */
export const accordionItemDataAttributes = {
  root: {
    disabled: 'data-disabled',
    open: 'data-open',
  },
} as const satisfies SlotDataAttributes<AccordionItemState>;
