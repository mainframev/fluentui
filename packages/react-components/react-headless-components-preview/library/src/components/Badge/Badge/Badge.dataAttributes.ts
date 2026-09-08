import type { SlotDataAttributes } from '../../../utils';
import type { BadgeState } from './Badge.types';

/** Data attribute names for Badge slots. */
export const badgeDataAttributes = {
  root: {
    iconPosition: 'data-icon-position',
  },
} as const satisfies SlotDataAttributes<BadgeState>;
