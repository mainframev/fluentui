import type { SlotDataAttributes } from '../../utils';
import type { SpinnerState } from './Spinner.types';

/** Data attribute names for Spinner slots. */
export const spinnerDataAttributes = {
  root: { labelPosition: 'data-label-position' },
} as const satisfies SlotDataAttributes<SpinnerState>;
