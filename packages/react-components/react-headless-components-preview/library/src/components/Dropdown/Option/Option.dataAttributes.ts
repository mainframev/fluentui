import type { SlotDataAttributes } from '../../../utils';
import type { OptionState } from './Option.types';

/** Data attribute names for Option slots. */
export const optionDataAttributes = {
  root: {
    disabled: 'data-disabled',
    multiselect: 'data-multiselect',
    selected: 'data-selected',
  },
} as const satisfies SlotDataAttributes<OptionState>;
