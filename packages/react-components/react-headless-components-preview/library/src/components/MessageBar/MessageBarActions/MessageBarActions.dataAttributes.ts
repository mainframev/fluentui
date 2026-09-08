import type { SlotDataAttributes } from '../../../utils';
import type { MessageBarActionsState } from './MessageBarActions.types';

/** Data attribute names for MessageBarActions slots. */
export const messageBarActionsDataAttributes = {
  root: {
    layout: 'data-layout',
    hasActions: 'data-has-actions',
  },
} as const satisfies SlotDataAttributes<MessageBarActionsState>;
