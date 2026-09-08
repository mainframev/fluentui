import type { SlotDataAttributes } from '../../../utils';
import type { MenuItemSwitchState } from './MenuItemSwitch.types';

/** Data attribute names for MenuItemSwitch slots. */
export const menuItemSwitchDataAttributes = {
  root: {
    disabled: 'data-disabled',
    checked: 'data-checked',
  },
} as const satisfies SlotDataAttributes<MenuItemSwitchState>;
