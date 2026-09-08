import type { SlotDataAttributes } from '../../utils';
import type { MenuButtonState } from './MenuButton.types';

/** Data attribute names for MenuButton slots. */
export const menuButtonDataAttributes = {
  root: {
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
    iconOnly: 'data-icon-only',
    open: 'data-open',
  },
} as const satisfies SlotDataAttributes<MenuButtonState>;
