import type { SlotDataAttributes } from '../../../utils';
import type { TabState } from './Tab.types';

/** Data attribute names for Tab slots. */
export const tabDataAttributes = {
  root: { iconOnly: 'data-icon-only', selected: 'data-selected', disabled: 'data-disabled' },
} as const satisfies SlotDataAttributes<TabState>;
