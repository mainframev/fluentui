import type { SlotDataAttributes } from '../../utils';
import type { FieldState } from './Field.types';

/** Data attribute names for Field slots. */
export const fieldDataAttributes = {
  root: {
    validateState: 'data-validate-state',
  },
} as const satisfies SlotDataAttributes<FieldState>;
