import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { RatingBasicExample } from '../Rating/Rating.Basic.Example';

export const ShadowDOMRatingExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <RatingBasicExample />
    </Shadow>
  );
};
