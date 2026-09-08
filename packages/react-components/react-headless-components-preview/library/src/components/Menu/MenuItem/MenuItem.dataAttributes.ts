import type { SlotDataAttributes } from '../../../utils';
import type { MenuItemState } from './MenuItem.types';

/** Data attribute names for MenuItem slots. */
export const menuItemDataAttributes = {
  root: {
    disabled: 'data-disabled',
    hasSubmenu: 'data-has-submenu',
    submenuOpen: 'data-submenu-open',
  },
} as const satisfies SlotDataAttributes<MenuItemState>;
