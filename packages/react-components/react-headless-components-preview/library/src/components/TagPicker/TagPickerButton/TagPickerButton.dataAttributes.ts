import type { SlotDataAttributes } from '../../../utils';
import type { TagPickerButtonState } from './TagPickerButton.types';

/** Data attribute names for TagPickerButton slots. */
export const tagPickerButtonDataAttributes = {
  root: { disabled: 'data-disabled' },
} as const satisfies SlotDataAttributes<TagPickerButtonState>;
