import type { SlotDataAttributes } from '../../utils';
import type { MessageBarState } from './MessageBar.types';

/** Data attribute names for MessageBar slots. */
export const messageBarDataAttributes = {
  root: {
    layout: 'data-layout',
    intent: 'data-intent',
  },
} as const satisfies SlotDataAttributes<MessageBarState>;
