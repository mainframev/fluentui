import type { SlotDataAttributes } from '../../../utils';
import type { ToastTitleState } from './ToastTitle.types';

/** Data attribute names for ToastTitle slots. */
export const toastTitleDataAttributes = {
  media: { intent: 'data-intent' },
} as const satisfies SlotDataAttributes<ToastTitleState>;
