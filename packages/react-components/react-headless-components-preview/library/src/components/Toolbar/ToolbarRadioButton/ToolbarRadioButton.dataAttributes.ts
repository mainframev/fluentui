import type { SlotDataAttributes } from '../../../utils';
import type { ToolbarRadioButtonState } from './ToolbarRadioButton.types';

/** Data attribute names for ToolbarRadioButton slots. */
export const toolbarRadioButtonDataAttributes = {
  root: {
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
    iconOnly: 'data-icon-only',
    checked: 'data-checked',
  },
} as const satisfies SlotDataAttributes<ToolbarRadioButtonState>;
