import type { SlotDataAttributes } from '../../utils';
import type { PersonaState } from './Persona.types';

/** Data attribute names for Persona slots. */
export const personaDataAttributes = {
  root: { textPosition: 'data-text-position' },
} as const satisfies SlotDataAttributes<PersonaState>;
