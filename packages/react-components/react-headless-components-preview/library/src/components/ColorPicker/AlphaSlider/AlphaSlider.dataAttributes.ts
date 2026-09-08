import type { SlotDataAttributes } from '../../../utils';
import type { AlphaSliderState } from './AlphaSlider.types';

/** Data attribute names for AlphaSlider slots. */
export const alphaSliderDataAttributes = {
  root: {
    channel: 'data-channel',
    orientation: 'data-orientation',
    transparency: 'data-transparency',
  },
} as const satisfies SlotDataAttributes<AlphaSliderState>;
