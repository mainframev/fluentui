import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { FacepileBasicExample } from '../Facepile/Facepile.Basic.Example';

export const ShadowDOMFacepileExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <FacepileBasicExample />
    </Shadow>
  );
};
