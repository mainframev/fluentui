import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { TeachingBubbleButtonOrderExample } from '../TeachingBubble/TeachingBubble.ButtonOrder.Example';

export const ShadowDOMTeachingBubbleButtonOrderExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <TeachingBubbleButtonOrderExample />
    </Shadow>
  );
};
