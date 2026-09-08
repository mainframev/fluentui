import type { SlotDataAttributes } from '../../../utils';
import type { InteractionTagSecondaryState } from './InteractionTagSecondary.types';

/** Data attribute names for InteractionTagSecondary slots. */
export const interactionTagSecondaryDataAttributes = {
  root: {
    disabled: 'data-disabled',
    selected: 'data-selected',
  },
} as const satisfies SlotDataAttributes<InteractionTagSecondaryState>;
