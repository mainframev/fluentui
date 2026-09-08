import type { SlotDataAttributes } from '../../../utils';
import type { DrawerHeaderState } from './DrawerHeader.types';

/** Data attribute names for DrawerHeader slots. */
export const drawerHeaderDataAttributes = {
  root: {
    scrollState: 'data-scroll-state',
  },
} as const satisfies SlotDataAttributes<DrawerHeaderState>;
