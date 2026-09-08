import type { SlotDataAttributes } from '../../../utils';
import type { AccordionHeaderState } from './AccordionHeader.types';

/** Data attribute names for AccordionHeader slots. */
export const accordionHeaderDataAttributes = {
  root: {
    disabled: 'data-disabled',
    expandIconPosition: 'data-expand-icon-position',
    open: 'data-open',
  },
} as const satisfies SlotDataAttributes<AccordionHeaderState>;
