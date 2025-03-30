import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { FocusTrapZoneBoxClickExample } from '../FocusTrapZone/FocusTrapZone.Box.Click.Example';

export const ShadowDOMFocusTrapZoneBoxClickExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <FocusTrapZoneBoxClickExample />
    </Shadow>
  );
};
