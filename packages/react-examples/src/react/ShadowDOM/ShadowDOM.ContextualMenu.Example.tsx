import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { ContextualMenuBasicExample } from '../ContextualMenu/ContextualMenu.Basic.Example';

export const ShadowDOMContextualMenuExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <ContextualMenuBasicExample />
    </Shadow>
  );
};
