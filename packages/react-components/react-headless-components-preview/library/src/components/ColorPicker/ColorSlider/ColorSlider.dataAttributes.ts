import type { SlotDataAttributes } from '../../../utils';
import type { ColorSliderState } from './ColorSlider.types';

/** Data attribute names for ColorSlider slots. */
export const colorSliderDataAttributes = {
  root: {
    channel: 'data-channel',
    orientation: 'data-orientation',
  },
} as const satisfies SlotDataAttributes<ColorSliderState>;
