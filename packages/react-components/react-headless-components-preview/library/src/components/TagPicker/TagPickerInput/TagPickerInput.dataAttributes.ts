import type { SlotDataAttributes } from '../../../utils';
import type { TagPickerInputState } from './TagPickerInput.types';

/** Data attribute names for TagPickerInput slots. */
export const tagPickerInputDataAttributes = {
  root: { disabled: 'data-disabled' },
} as const satisfies SlotDataAttributes<TagPickerInputState>;
