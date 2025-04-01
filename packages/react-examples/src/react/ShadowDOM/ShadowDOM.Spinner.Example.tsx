import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { SpinnerBasicExample } from '../Spinner/Spinner.Basic.Example';

export const ShadowDOMSpinnerExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <SpinnerBasicExample />
    </Shadow>
  );
};
