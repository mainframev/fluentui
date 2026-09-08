import type { SlotDataAttributes } from '../../utils';
import type { SelectState } from './Select.types';

/** Data attribute names for Select slots. */
export const selectDataAttributes = {
  root: { disabled: 'data-disabled', invalid: 'data-invalid' },
} as const satisfies SlotDataAttributes<SelectState>;
