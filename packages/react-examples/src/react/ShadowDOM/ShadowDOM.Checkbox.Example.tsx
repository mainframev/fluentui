import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { CheckboxBasicExample } from '../Checkbox/Checkbox.Basic.Example';

export const ShadowDOMCheckboxExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <CheckboxBasicExample />
    </Shadow>
  );
};
