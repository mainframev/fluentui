import type { SlotDataAttributes } from '../../utils';
import type { TooltipState } from './Tooltip.types';

/** Data attribute names for Tooltip slots. */
export const tooltipDataAttributes = {
  content: { open: 'data-open' },
} as const satisfies SlotDataAttributes<TooltipState>;
