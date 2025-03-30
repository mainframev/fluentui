import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { LinkBasicExample } from '../Link/Link.Basic.Example';

export const ShadowDOMLinkExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <LinkBasicExample />
    </Shadow>
  );
};
