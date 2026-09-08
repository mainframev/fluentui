import type { SlotDataAttributes } from '../../../utils';
import type { NavItemState } from './NavItem.types';

/** Data attribute names for NavItem slots. */
export const navItemDataAttributes = {
  root: { selected: 'data-selected' },
} as const satisfies SlotDataAttributes<NavItemState>;
