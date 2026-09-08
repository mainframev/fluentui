import type { SlotDataAttributes } from '../../utils';
import type { TagGroupState } from './TagGroup.types';

/** Data attribute names for TagGroup slots. */
export const tagGroupDataAttributes = {
  root: { disabled: 'data-disabled', dismissible: 'data-dismissible' },
} as const satisfies SlotDataAttributes<TagGroupState>;
