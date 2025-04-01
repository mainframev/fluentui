import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { FocusTrapZoneDialogInPanelExample } from '../FocusTrapZone/FocusTrapZone.DialogInPanel.Example';

export const ShadowDOMFocusTrapZoneDialogInPanelExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <FocusTrapZoneDialogInPanelExample />
    </Shadow>
  );
};
