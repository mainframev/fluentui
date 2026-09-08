import type { SlotDataAttributes } from '../../../utils';
import type { TagPickerGroupState } from './TagPickerGroup.types';

/** Data attribute names for TagPickerGroup slots. */
export const tagPickerGroupDataAttributes = {
  root: { disabled: 'data-disabled' },
} as const satisfies SlotDataAttributes<TagPickerGroupState>;
