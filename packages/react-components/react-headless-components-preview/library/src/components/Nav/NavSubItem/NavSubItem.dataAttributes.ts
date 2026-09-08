import type { SlotDataAttributes } from '../../../utils';
import type { NavSubItemState } from './NavSubItem.types';

/** Data attribute names for NavSubItem slots. */
export const navSubItemDataAttributes = {
  root: { selected: 'data-selected' },
} as const satisfies SlotDataAttributes<NavSubItemState>;
