import type { SlotDataAttributes } from '../../../utils';
import type { MenuItemLinkState } from './MenuItemLink.types';

/** Data attribute names for MenuItemLink slots. */
export const menuItemLinkDataAttributes = {
  root: {
    disabled: 'data-disabled',
  },
} as const satisfies SlotDataAttributes<MenuItemLinkState>;
