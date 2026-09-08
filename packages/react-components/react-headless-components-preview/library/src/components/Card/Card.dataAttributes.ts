import type { SlotDataAttributes } from '../../utils';
import type { CardState } from './Card.types';

/** Data attribute names for Card slots. */
export const cardDataAttributes = {
  root: {
    disabled: 'data-disabled',
    selected: 'data-selected',
  },
} as const satisfies SlotDataAttributes<CardState>;
