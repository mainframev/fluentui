import type { SlotDataAttributes } from '../../utils';
import type { InteractionTagState } from './InteractionTag.types';

/** Data attribute names for InteractionTag slots. */
export const interactionTagDataAttributes = {
  root: {
    disabled: 'data-disabled',
    selected: 'data-selected',
  },
} as const satisfies SlotDataAttributes<InteractionTagState>;
