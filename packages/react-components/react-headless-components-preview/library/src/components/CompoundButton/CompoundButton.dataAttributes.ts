import type { SlotDataAttributes } from '../../utils';
import type { CompoundButtonState } from './CompoundButton.types';

/** Data attribute names for CompoundButton slots. */
export const compoundButtonDataAttributes = {
  root: {
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
    hasSecondaryContent: 'data-has-secondary-content',
    iconOnly: 'data-icon-only',
  },
} as const satisfies SlotDataAttributes<CompoundButtonState>;
