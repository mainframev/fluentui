import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { VerticalStackBasicExample } from '../Stack/Stack.Vertical.Basic.Example';

export const ShadowDOMStackExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <VerticalStackBasicExample />
    </Shadow>
  );
};
