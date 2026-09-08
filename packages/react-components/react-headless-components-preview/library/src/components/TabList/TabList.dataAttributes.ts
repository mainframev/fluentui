import type { SlotDataAttributes } from '../../utils';
import type { TabListState } from './TabList.types';

/** Data attribute names for TabList slots. */
export const tabListDataAttributes = {
  root: { orientation: 'data-orientation' },
} as const satisfies SlotDataAttributes<TabListState>;
