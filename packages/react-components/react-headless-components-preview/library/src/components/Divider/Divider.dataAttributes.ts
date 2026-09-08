import type { SlotDataAttributes } from '../../utils';
import type { DividerState } from './Divider.types';

/** Data attribute names for Divider slots. */
export const dividerDataAttributes = {
  root: {
    orientation: 'data-orientation',
  },
} as const satisfies SlotDataAttributes<DividerState>;
