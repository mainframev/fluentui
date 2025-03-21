import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { ExtendedPeoplePickerBasicExample } from '../ExtendedPeoplePicker/ExtendedPeoplePicker.Basic.Example';

export const ShadowDOMExtendedPeoplePickerExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <ExtendedPeoplePickerBasicExample />
    </Shadow>
  );
};
