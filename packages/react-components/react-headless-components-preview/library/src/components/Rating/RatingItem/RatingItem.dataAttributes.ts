import type { SlotDataAttributes } from '../../../utils';
import type { RatingItemState } from './RatingItem.types';

/** Data attribute names for RatingItem slots. */
export const ratingItemDataAttributes = {
  root: { appearance: 'data-appearance' },
} as const satisfies SlotDataAttributes<RatingItemState>;
