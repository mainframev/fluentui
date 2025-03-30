import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { KeytipsBasicExample } from '../Keytip/Keytips.Basic.Example';

export const ShadowDOMKeytipExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <KeytipsBasicExample />
    </Shadow>
  );
};
