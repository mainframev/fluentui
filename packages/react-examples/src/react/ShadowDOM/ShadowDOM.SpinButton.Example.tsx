import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { SpinButtonBasicExample } from '../SpinButton/SpinButton.Basic.Example';

export const ShadowDOMSpinButtonExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <SpinButtonBasicExample />
    </Shadow>
  );
};
