import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { LayerBasicExample } from '../Layer/Layer.Basic.Example';

export const ShadowDOMLayerExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <LayerBasicExample />
    </Shadow>
  );
};
