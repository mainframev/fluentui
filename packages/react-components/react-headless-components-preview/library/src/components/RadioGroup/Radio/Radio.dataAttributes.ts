import type { SlotDataAttributes } from '../../../utils';
import type { RadioState } from './Radio.types';

/** Data attribute names for Radio slots. */
export const radioDataAttributes = {
  root: { disabled: 'data-disabled', labelPosition: 'data-label-position' },
} as const satisfies SlotDataAttributes<RadioState>;
