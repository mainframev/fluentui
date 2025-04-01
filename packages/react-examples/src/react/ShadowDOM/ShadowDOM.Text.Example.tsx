import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { TextRampExample } from '../Text/Text.Weights.Example';

export const ShadowDOMTextExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <TextRampExample />
    </Shadow>
  );
};
