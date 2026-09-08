import type { SlotDataAttributes } from '../../utils';
import type { TextareaState } from './Textarea.types';

/** Data attribute names for Textarea slots. */
export const textareaDataAttributes = {
  root: { disabled: 'data-disabled', invalid: 'data-invalid', resize: 'data-resize' },
} as const satisfies SlotDataAttributes<TextareaState>;
