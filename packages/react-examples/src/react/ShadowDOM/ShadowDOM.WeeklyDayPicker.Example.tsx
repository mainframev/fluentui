import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { WeeklyDayPickerInlineExample } from '../WeeklyDayPicker/WeeklyDayPicker.Inline.Example';

export const ShadowDOMWeeklyDayPickerExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <WeeklyDayPickerInlineExample />
    </Shadow>
  );
};
