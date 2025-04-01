import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { TooltipBasicExample } from '../Tooltip/Tooltip.Basic.Example';

export const ShadowDOMTooltipExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <TooltipBasicExample />
    </Shadow>
  );
};
