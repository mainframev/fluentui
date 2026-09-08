import type { SlotDataAttributes } from '../../utils';
import type { ToastState } from './Toast.types';

/** Data attribute names for Toast slots. */
export const toastDataAttributes = {
  root: { intent: 'data-intent' },
} as const satisfies SlotDataAttributes<ToastState>;
