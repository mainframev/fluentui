import type { SlotDataAttributes } from '../../utils';
import type { CheckboxState } from './Checkbox.types';

/** Data attribute names for Checkbox slots. */
export const checkboxDataAttributes = {
  root: {
    checked: 'data-checked',
    disabled: 'data-disabled',
    labelPosition: 'data-label-position',
  },
} as const satisfies SlotDataAttributes<CheckboxState>;
