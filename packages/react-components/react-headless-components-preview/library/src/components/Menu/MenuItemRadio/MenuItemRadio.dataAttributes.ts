import type { SlotDataAttributes } from '../../../utils';
import type { MenuItemRadioState } from './MenuItemRadio.types';

/** Data attribute names for MenuItemRadio slots. */
export const menuItemRadioDataAttributes = {
  root: {
    disabled: 'data-disabled',
    hasSubmenu: 'data-has-submenu',
    submenuOpen: 'data-submenu-open',
    checked: 'data-checked',
  },
} as const satisfies SlotDataAttributes<MenuItemRadioState>;
