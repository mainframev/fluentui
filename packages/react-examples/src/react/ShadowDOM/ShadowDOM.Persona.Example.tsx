import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { PersonaBasicExample } from '../Persona/Persona.Basic.Example';

export const ShadowDOMPersonaExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <PersonaBasicExample />
    </Shadow>
  );
};
