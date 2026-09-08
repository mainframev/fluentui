import type { SlotDataAttributes } from '../../../utils';
import type { ToolbarToggleButtonState } from './ToolbarToggleButton.types';

/** Data attribute names for ToolbarToggleButton slots. */
export const toolbarToggleButtonDataAttributes = {
  root: {
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
    iconOnly: 'data-icon-only',
    checked: 'data-checked',
  },
} as const satisfies SlotDataAttributes<ToolbarToggleButtonState>;
