import type { SlotDataAttributes } from '../../utils';
import type { SearchBoxState } from './Search.types';

/** Data attribute names for SearchBox slots. */
export const searchBoxDataAttributes = {
  root: { disabled: 'data-disabled', focused: 'data-focused' },
} as const satisfies SlotDataAttributes<SearchBoxState>;
