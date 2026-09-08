import type { SlotDataAttributes } from '../../../utils';
import type { TagPickerControlState } from './TagPickerControl.types';

/** Data attribute names for TagPickerControl slots. */
export const tagPickerControlDataAttributes = {
  root: { disabled: 'data-disabled', invalid: 'data-invalid' },
} as const satisfies SlotDataAttributes<TagPickerControlState>;
