import type { SlotDataAttributes } from '../../../utils';
import type { InfoButtonState } from './InfoButton.types';

/** Data attribute names for InfoButton slots. */
export const infoButtonDataAttributes = {
  root: {
    open: 'data-open',
  },
} as const satisfies SlotDataAttributes<InfoButtonState>;
