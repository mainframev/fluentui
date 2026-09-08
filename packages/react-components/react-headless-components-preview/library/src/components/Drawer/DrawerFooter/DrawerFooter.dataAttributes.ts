import type { SlotDataAttributes } from '../../../utils';
import type { DrawerFooterState } from './DrawerFooter.types';

/** Data attribute names for DrawerFooter slots. */
export const drawerFooterDataAttributes = {
  root: {
    scrollState: 'data-scroll-state',
  },
} as const satisfies SlotDataAttributes<DrawerFooterState>;
