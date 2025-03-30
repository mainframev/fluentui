import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { DatePickerBasicExample } from '../DatePicker/DatePicker.Basic.Example';

export const ShadowDOMDatePickerExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <DatePickerBasicExample />
    </Shadow>
  );
};
