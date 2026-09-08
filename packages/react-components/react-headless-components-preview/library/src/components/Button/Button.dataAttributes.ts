import type { SlotDataAttributes } from '../../utils';
import type { ButtonState } from './Button.types';

/** Data attribute names for Button slots. */
export const buttonDataAttributes = {
  root: {
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
    iconOnly: 'data-icon-only',
    iconPosition: 'data-icon-position',
  },
} as const satisfies SlotDataAttributes<ButtonState>;
