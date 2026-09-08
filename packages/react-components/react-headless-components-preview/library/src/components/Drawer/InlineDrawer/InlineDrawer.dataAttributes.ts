import type { SlotDataAttributes } from '../../../utils';
import type { InlineDrawerState } from './InlineDrawer.types';

/** Data attribute names for InlineDrawer slots. */
export const inlineDrawerDataAttributes = {
  root: {
    open: 'data-open',
    position: 'data-position',
  },
} as const satisfies SlotDataAttributes<InlineDrawerState>;
