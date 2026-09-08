import type { SlotDataAttributes } from '../../../utils';
import type { NavCategoryItemState } from './NavCategoryItem.types';

/** Data attribute names for NavCategoryItem slots. */
export const navCategoryItemDataAttributes = {
  root: { open: 'data-open', selected: 'data-selected' },
} as const satisfies SlotDataAttributes<NavCategoryItemState>;
