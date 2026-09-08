import type { SlotDataAttributes } from '../../utils';
import type { ComboboxState } from './Combobox.types';

/** Data attribute names for Combobox slots. */
export const comboboxDataAttributes = {
  root: {
    clearable: 'data-clearable',
    disabled: 'data-disabled',
    invalid: 'data-invalid',
    open: 'data-open',
    placeholder: 'data-placeholder',
  },
} as const satisfies SlotDataAttributes<ComboboxState>;
