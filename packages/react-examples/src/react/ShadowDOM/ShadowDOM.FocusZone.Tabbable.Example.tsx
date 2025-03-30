import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { FocusZoneTabbableExample } from '../../react-focus/FocusZone/FocusZone.Tabbable.Example';

export const ShadowDOMFocusZoneTabbableExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <FocusZoneTabbableExample />
    </Shadow>
  );
};
