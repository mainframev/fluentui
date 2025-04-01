import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { TeachingBubbleSmallHeadlineExample } from '../TeachingBubble/TeachingBubble.SmallHeadline.Example';

export const ShadowDOMTeachingBubbleSmallHeadlineExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <TeachingBubbleSmallHeadlineExample />
    </Shadow>
  );
};
