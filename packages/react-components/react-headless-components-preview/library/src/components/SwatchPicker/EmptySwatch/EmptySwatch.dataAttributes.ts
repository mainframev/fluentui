import type { SlotDataAttributes } from '../../../utils';
import type { EmptySwatchState } from './EmptySwatch.types';

/** Data attribute names for EmptySwatch slots. */
export const emptySwatchDataAttributes = {
  root: { selected: 'data-selected', disabled: 'data-disabled' },
} as const satisfies SlotDataAttributes<EmptySwatchState>;
