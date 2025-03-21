import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { ProgressIndicatorBasicExample } from '../ProgressIndicator/ProgressIndicator.Basic.Example';

export const ShadowDOMProgressIndicatorExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <ProgressIndicatorBasicExample />
    </Shadow>
  );
};
