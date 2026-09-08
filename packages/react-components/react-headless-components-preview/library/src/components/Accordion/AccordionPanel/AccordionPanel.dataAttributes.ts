import type { SlotDataAttributes } from '../../../utils';
import type { AccordionPanelState } from './AccordionPanel.types';

/** Data attribute names for AccordionPanel slots. */
export const accordionPanelDataAttributes = {
  root: {
    open: 'data-open',
  },
} as const satisfies SlotDataAttributes<AccordionPanelState>;
