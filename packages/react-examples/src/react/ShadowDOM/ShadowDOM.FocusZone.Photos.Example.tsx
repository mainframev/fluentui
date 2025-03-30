import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { FocusZonePhotosExample } from '../../react-focus/FocusZone/FocusZone.Photos.Example';

export const ShadowDOMFocusZonePhotosExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <FocusZonePhotosExample />
    </Shadow>
  );
};
