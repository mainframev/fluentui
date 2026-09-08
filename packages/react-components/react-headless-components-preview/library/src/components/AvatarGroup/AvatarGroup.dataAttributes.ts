import type { SlotDataAttributes } from '../../utils';
import type { AvatarGroupState } from './AvatarGroup.types';

/** Data attribute names for AvatarGroup slots. */
export const avatarGroupDataAttributes = {
  root: {
    layout: 'data-layout',
  },
} as const satisfies SlotDataAttributes<AvatarGroupState>;
