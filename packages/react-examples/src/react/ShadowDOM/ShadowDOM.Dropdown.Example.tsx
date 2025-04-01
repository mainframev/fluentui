import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { DropdownBasicExample } from '../Dropdown/Dropdown.Basic.Example';

export const ShadowDOMDropdownExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <DropdownBasicExample />
    </Shadow>
  );
};
