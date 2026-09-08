import type { SlotDataAttributes } from '../../../utils';
import type { ColorSwatchState } from './ColorSwatch.types';

/** Data attribute names for ColorSwatch slots. */
export const colorSwatchDataAttributes = {
  root: { selected: 'data-selected', disabled: 'data-disabled' },
} as const satisfies SlotDataAttributes<ColorSwatchState>;
