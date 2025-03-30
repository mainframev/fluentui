import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { SeparatorBasicExample } from '../Separator/Separator.Basic.Example';

export const ShadowDOMSeparatorExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <SeparatorBasicExample />
    </Shadow>
  );
};
