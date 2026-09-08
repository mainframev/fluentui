import type { SlotDataAttributes } from '../../../utils';
import type { TeachingPopoverCarouselNavButtonState } from './TeachingPopoverCarouselNavButton.types';

/** Data attribute names for TeachingPopoverCarouselNavButton slots. */
export const teachingPopoverCarouselNavButtonDataAttributes = {
  root: { selected: 'data-selected' },
} as const satisfies SlotDataAttributes<TeachingPopoverCarouselNavButtonState>;
