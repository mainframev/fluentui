import type { SlotDataAttributes } from '../../../utils';
import type { CounterBadgeState } from './CounterBadge.types';

/** Data attribute names for CounterBadge slots. */
export const counterBadgeDataAttributes = {
  root: {
    count: 'data-count',
    dot: 'data-dot',
    hidden: 'data-hidden',
    overflowed: 'data-overflowed',
  },
} as const satisfies SlotDataAttributes<CounterBadgeState>;
