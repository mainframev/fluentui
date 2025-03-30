import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { TeachingBubbleWideIllustrationExample } from '../TeachingBubble/TeachingBubble.WideIllustration.Example';

export const ShadowDOMTeachingBubbleWideIllustrationExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <TeachingBubbleWideIllustrationExample />
    </Shadow>
  );
};
