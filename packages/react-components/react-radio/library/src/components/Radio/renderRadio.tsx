/** @jsxRuntime automatic */
/** @jsxImportSource @fluentui/react-jsx-runtime */

import { assertSlots } from '@fluentui/react-utilities';
import { assertSlots as assertSlotsV2 } from '@fluentui/react-utilities/next';
import type { RadioSlots, RadioSlotsV2, RadioStateV2, RadioState } from './Radio.types';

/**
 * Render the final JSX of Radio
 */
export const renderRadio_unstable = (state: RadioState) => {
  assertSlots<RadioSlots>(state);

  return (
    <state.root>
      <state.input />
      <state.indicator />
      {state.label && <state.label />}
    </state.root>
  );
};

export const renderRadio_unstableV2 = (state: RadioStateV2) => {
  assertSlotsV2<RadioSlotsV2>(state);

  return (
    <state.root>
      <state.input />
      <state.indicator />
      {state.label && <state.label />}
    </state.root>
  );
};
