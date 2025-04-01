import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { TeachingBubbleMultiStepExample } from '../TeachingBubble/TeachingBubble.MultiStep.Example';

export const ShadowDOMTeachingBubbleMultiStepExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <TeachingBubbleMultiStepExample />
    </Shadow>
  );
};
