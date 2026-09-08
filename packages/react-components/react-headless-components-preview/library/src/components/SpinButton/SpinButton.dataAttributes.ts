import type { SlotDataAttributes } from '../../utils';
import type { SpinButtonState } from './SpinButton.types';

/** Data attribute names for SpinButton slots. */
export const spinButtonDataAttributes = {
  root: {
    disabled: 'data-disabled',
    spinState: 'data-spin-state',
    atBound: 'data-at-bound',
    invalid: 'data-invalid',
  },
} as const satisfies SlotDataAttributes<SpinButtonState>;
