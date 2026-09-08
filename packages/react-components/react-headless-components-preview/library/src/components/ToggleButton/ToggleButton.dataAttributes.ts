import type { SlotDataAttributes } from '../../utils';
import type { ToggleButtonState } from './ToggleButton.types';

/** Data attribute names for ToggleButton slots. */
export const toggleButtonDataAttributes = {
  root: {
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
    iconOnly: 'data-icon-only',
    checked: 'data-checked',
    iconPosition: 'data-icon-position',
  },
} as const satisfies SlotDataAttributes<ToggleButtonState>;
