import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { PanelBasicExample } from '../Panel/Panel.Basic.Example';

export const ShadowDOMPanelExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <PanelBasicExample />
    </Shadow>
  );
};
