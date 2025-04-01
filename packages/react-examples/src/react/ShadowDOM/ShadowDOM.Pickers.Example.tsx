import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { TagPickerBasicExample } from '../Pickers/TagPicker.Basic.Example';

export const ShadowDOMPickersExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <TagPickerBasicExample />
    </Shadow>
  );
};
