import type { SlotDataAttributes } from '../../../utils';
import type { InteractionTagPrimaryState } from './InteractionTagPrimary.types';

/** Data attribute names for InteractionTagPrimary slots. */
export const interactionTagPrimaryDataAttributes = {
  root: {
    disabled: 'data-disabled',
    selected: 'data-selected',
    hasSecondaryAction: 'data-has-secondary-action',
  },
} as const satisfies SlotDataAttributes<InteractionTagPrimaryState>;
