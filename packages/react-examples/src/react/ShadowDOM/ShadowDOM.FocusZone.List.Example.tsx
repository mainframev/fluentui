import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { FocusZoneListExample } from '../../react-focus/FocusZone/FocusZone.List.Example';

export const ShadowDOMFocusZoneListExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <FocusZoneListExample />
    </Shadow>
  );
};
