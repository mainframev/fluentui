import type { SlotDataAttributes } from '../../utils';
import type { SliderState } from './Slider.types';

/** Data attribute names for Slider slots. */
export const sliderDataAttributes = {
  root: { disabled: 'data-disabled', vertical: 'data-vertical' },
} as const satisfies SlotDataAttributes<SliderState>;
