import type { SlotDataAttributes } from '../../utils';
import type { SwitchState } from './Switch.types';

/** Data attribute names for Switch slots. */
export const switchDataAttributes = {
  root: {
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
    checked: 'data-checked',
    labelPosition: 'data-label-position',
  },
} as const satisfies SlotDataAttributes<SwitchState>;
