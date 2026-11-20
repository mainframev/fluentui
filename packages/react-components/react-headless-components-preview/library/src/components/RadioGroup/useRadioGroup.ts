'use client';

import type * as React from 'react';
import { isHTMLElement, mergeCallbacks, useControllableState } from '@fluentui/react-utilities';
import { useRadioGroupBase_unstable } from '@fluentui/react-radio';
import type { RadioGroupProps, RadioGroupState } from './RadioGroup.types';

/**
 * Returns the state for a RadioGroup component, given its props and ref.
 * Tracks the selected value so headless Radios can expose `data-checked` in uncontrolled groups.
 */
export const useRadioGroup = (props: RadioGroupProps, ref: React.Ref<HTMLDivElement>): RadioGroupState => {
  const baseState = useRadioGroupBase_unstable(props, ref);
  const [selectedValue, setSelectedValue] = useControllableState<string | undefined>({
    state: baseState.value,
    defaultState: baseState.defaultValue,
    initialState: undefined,
  });

  // eslint-disable-next-line react-hooks/immutability
  baseState.root.onChange = mergeCallbacks(baseState.root.onChange, (ev: React.FormEvent<HTMLDivElement>) => {
    if (isHTMLElement(ev.target, { constructorName: 'HTMLInputElement' }) && ev.target.type === 'radio') {
      setSelectedValue(ev.target.value);
    }
  });

  return { ...baseState, selectedValue };
};
