import type { SlotDataAttributes } from '../../utils';
import type { LabelState } from './Label.types';

/** Data attribute names for Label slots. */
export const labelDataAttributes = {
  root: {
    disabled: 'data-disabled',
    required: 'data-required',
  },
} as const satisfies SlotDataAttributes<LabelState>;
