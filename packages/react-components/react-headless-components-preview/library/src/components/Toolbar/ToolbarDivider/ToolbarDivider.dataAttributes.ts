import type { SlotDataAttributes } from '../../../utils';
import type { ToolbarDividerState } from './ToolbarDivider.types';

/** Data attribute names for ToolbarDivider slots. */
export const toolbarDividerDataAttributes = {
  root: { vertical: 'data-vertical' },
} as const satisfies SlotDataAttributes<ToolbarDividerState>;
