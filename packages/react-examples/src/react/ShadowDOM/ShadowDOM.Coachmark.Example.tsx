import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { CoachmarkBasicExample } from '../Coachmark/Coachmark.Basic.Example';

export const ShadowDOMCoachmarkExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <CoachmarkBasicExample />
    </Shadow>
  );
};
