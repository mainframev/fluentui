import type { SlotDataAttributes } from '../../../utils';
import type { ToolbarGroupState } from './ToolbarGroup.types';

/** Data attribute names for ToolbarGroup slots. */
export const toolbarGroupDataAttributes = {
  root: { vertical: 'data-vertical' },
} as const satisfies SlotDataAttributes<ToolbarGroupState>;
