import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { VerticalDividerBasicExample } from '../Divider/VerticalDivider.Basic.Example';

export const ShadowDOMVerticalDividerExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <VerticalDividerBasicExample />
    </Shadow>
  );
};
