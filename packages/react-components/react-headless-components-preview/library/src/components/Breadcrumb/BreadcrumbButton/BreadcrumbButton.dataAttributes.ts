import type { SlotDataAttributes } from '../../../utils';
import type { BreadcrumbButtonState } from './BreadcrumbButton.types';

/** Data attribute names for BreadcrumbButton slots. */
export const breadcrumbButtonDataAttributes = {
  root: {
    current: 'data-current',
  },
} as const satisfies SlotDataAttributes<BreadcrumbButtonState>;
