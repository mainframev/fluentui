import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { TeachingBubbleBasicExample } from '../TeachingBubble/TeachingBubble.Basic.Example';

export const ShadowDOMTeachingBubbleExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <TeachingBubbleBasicExample />
    </Shadow>
  );
};
