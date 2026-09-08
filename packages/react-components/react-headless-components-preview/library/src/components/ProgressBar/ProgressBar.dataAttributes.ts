import type { SlotDataAttributes } from '../../utils';
import type { ProgressBarState } from './ProgressBar.types';

/** Data attribute names for ProgressBar slots. */
export const progressBarDataAttributes = {
  root: { indeterminate: 'data-indeterminate' },
} as const satisfies SlotDataAttributes<ProgressBarState>;
