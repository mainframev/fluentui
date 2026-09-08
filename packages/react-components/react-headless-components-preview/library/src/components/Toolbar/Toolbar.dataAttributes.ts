import type { SlotDataAttributes } from '../../utils';
import type { ToolbarState } from './Toolbar.types';

/** Data attribute names for Toolbar slots. */
export const toolbarDataAttributes = {
  root: { vertical: 'data-vertical' },
} as const satisfies SlotDataAttributes<ToolbarState>;
