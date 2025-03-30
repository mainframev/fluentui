import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { DialogBasicExample } from '../Dialog/Dialog.Basic.Example';

export const ShadowDOMDialogExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <DialogBasicExample />
    </Shadow>
  );
};
