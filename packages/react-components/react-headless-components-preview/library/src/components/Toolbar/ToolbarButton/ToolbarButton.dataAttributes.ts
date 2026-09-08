import type { SlotDataAttributes } from '../../../utils';
import type { ToolbarButtonState } from './ToolbarButton.types';

/** Data attribute names for ToolbarButton slots. */
export const toolbarButtonDataAttributes = {
  root: {
    vertical: 'data-vertical',
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
    iconOnly: 'data-icon-only',
  },
} as const satisfies SlotDataAttributes<ToolbarButtonState>;
