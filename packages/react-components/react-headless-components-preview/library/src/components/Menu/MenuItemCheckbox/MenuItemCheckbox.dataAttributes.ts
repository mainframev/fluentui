import type { SlotDataAttributes } from '../../../utils';
import type { MenuItemCheckboxState } from './MenuItemCheckbox.types';

/** Data attribute names for MenuItemCheckbox slots. */
export const menuItemCheckboxDataAttributes = {
  root: {
    disabled: 'data-disabled',
    hasSubmenu: 'data-has-submenu',
    submenuOpen: 'data-submenu-open',
    checked: 'data-checked',
  },
} as const satisfies SlotDataAttributes<MenuItemCheckboxState>;
