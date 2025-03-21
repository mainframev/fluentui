import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { ChoiceGroupBasicExample } from '../ChoiceGroup/ChoiceGroup.Basic.Example';

export const ShadowDOMChoiceGroupExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <ChoiceGroupBasicExample />
    </Shadow>
  );
};
