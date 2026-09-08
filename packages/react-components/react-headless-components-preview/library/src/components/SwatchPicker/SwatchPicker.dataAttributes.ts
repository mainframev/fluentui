import type { SlotDataAttributes } from '../../utils';
import type { SwatchPickerState } from './SwatchPicker.types';

/** Data attribute names for SwatchPicker slots. */
export const swatchPickerDataAttributes = {
  root: { layout: 'data-layout' },
} as const satisfies SlotDataAttributes<SwatchPickerState>;
