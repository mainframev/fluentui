import type { SlotDataAttributes } from '../../utils';
import type { TagState } from './Tag.types';

/** Data attribute names for Tag slots. */
export const tagDataAttributes = {
  root: { disabled: 'data-disabled', dismissible: 'data-dismissible', selected: 'data-selected' },
} as const satisfies SlotDataAttributes<TagState>;
