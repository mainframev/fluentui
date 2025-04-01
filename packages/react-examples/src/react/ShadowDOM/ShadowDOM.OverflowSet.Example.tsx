import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { OverflowSetBasicExample } from '../OverflowSet/OverflowSet.Basic.Example';

export const ShadowDOMOverflowSetExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <OverflowSetBasicExample />
    </Shadow>
  );
};
