import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { FocusTrapZoneFocusZoneExample } from '../FocusTrapZone/FocusTrapZone.FocusZone.Example';

export const ShadowDOMFocusTrapZoneFocusZoneExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <FocusTrapZoneFocusZoneExample />
    </Shadow>
  );
};
