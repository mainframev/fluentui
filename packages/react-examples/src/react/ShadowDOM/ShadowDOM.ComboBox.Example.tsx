import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { ComboBoxBasicExample } from '../ComboBox/ComboBox.Basic.Example';

export const ShadowDOMComboBoxExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <ComboBoxBasicExample />
    </Shadow>
  );
};
