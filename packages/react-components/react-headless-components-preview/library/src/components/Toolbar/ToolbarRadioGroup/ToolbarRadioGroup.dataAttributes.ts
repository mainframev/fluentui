import type { SlotDataAttributes } from '../../../utils';
import type { ToolbarRadioGroupState } from './ToolbarRadioGroup.types';

/** Data attribute names for ToolbarRadioGroup slots. */
export const toolbarRadioGroupDataAttributes = {
  root: { vertical: 'data-vertical' },
} as const satisfies SlotDataAttributes<ToolbarRadioGroupState>;
