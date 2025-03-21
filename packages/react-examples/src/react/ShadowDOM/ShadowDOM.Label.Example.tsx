import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { LabelBasicExample } from '../Label/Label.Basic.Example';

export const ShadowDOMLabelExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <LabelBasicExample />
    </Shadow>
  );
};
