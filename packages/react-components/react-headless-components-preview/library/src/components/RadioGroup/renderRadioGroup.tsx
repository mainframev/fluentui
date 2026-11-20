import * as React from 'react';
import { renderRadioGroup_unstable } from '@fluentui/react-radio';
import type { JSXElement } from '@fluentui/react-utilities';
import type { RadioGroupContextValues, RadioGroupState } from './RadioGroup.types';
import { RadioGroupSelectionProvider } from './radioGroupSelectionContext';

/**
 * Renders RadioGroup and provides its selected value to headless Radios.
 */
export const renderRadioGroup = (state: RadioGroupState, contextValues: RadioGroupContextValues): JSXElement => (
  <RadioGroupSelectionProvider value={{ selectedValue: state.selectedValue }}>
    {renderRadioGroup_unstable(state, contextValues)}
  </RadioGroupSelectionProvider>
);
