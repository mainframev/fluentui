import type { SlotDataAttributes } from '../../utils';
import type { DropdownState } from './Dropdown.types';

/** Data attribute names for Dropdown slots. */
export const dropdownDataAttributes = {
  root: {
    clearable: 'data-clearable',
    disabled: 'data-disabled',
    invalid: 'data-invalid',
    open: 'data-open',
    placeholder: 'data-placeholder',
  },
} as const satisfies SlotDataAttributes<DropdownState>;
