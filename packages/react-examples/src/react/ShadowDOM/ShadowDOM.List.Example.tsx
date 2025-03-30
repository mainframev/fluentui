import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { ListBasicExample } from '../List/List.Basic.Example';

export const ShadowDOMListExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <ListBasicExample />
    </Shadow>
  );
};
