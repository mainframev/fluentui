import type { SlotDataAttributes } from '../../utils';
import type { LinkState } from './Link.types';

/** Data attribute names for Link slots. */
export const linkDataAttributes = {
  root: {
    disabled: 'data-disabled',
    disabledFocusable: 'data-disabled-focusable',
  },
} as const satisfies SlotDataAttributes<LinkState>;
