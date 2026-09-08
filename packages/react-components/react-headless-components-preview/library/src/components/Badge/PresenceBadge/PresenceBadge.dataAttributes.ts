import type { SlotDataAttributes } from '../../../utils';
import type { PresenceBadgeState } from './PresenceBadge.types';

/** Data attribute names for PresenceBadge slots. */
export const presenceBadgeDataAttributes = {
  root: {
    outOfOffice: 'data-out-of-office',
    status: 'data-status',
  },
} as const satisfies SlotDataAttributes<PresenceBadgeState>;
