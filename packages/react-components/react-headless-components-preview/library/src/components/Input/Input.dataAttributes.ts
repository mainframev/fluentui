import type { SlotDataAttributes } from '../../utils';
import type { InputState } from './Input.types';

/** Data attribute names for Input slots. */
export const inputDataAttributes = {
  root: {
    disabled: 'data-disabled',
    invalid: 'data-invalid',
  },
} as const satisfies SlotDataAttributes<InputState>;
