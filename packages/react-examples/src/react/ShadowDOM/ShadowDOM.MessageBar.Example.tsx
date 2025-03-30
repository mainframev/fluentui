import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { MessageBarBasicExample } from '../MessageBar/MessageBar.Basic.Example';

export const ShadowDOMMessageBarExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <MessageBarBasicExample />
    </Shadow>
  );
};
