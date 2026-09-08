import type { SlotDataAttributes } from '../../../utils';
import type { ImageSwatchState } from './ImageSwatch.types';

/** Data attribute names for ImageSwatch slots. */
export const imageSwatchDataAttributes = {
  root: { selected: 'data-selected' },
} as const satisfies SlotDataAttributes<ImageSwatchState>;
