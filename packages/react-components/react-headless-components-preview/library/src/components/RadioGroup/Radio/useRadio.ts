'use client';

import type * as React from 'react';
import { mergeCallbacks, useControllableState } from '@fluentui/react-utilities';
import { useRadioBase_unstable } from '@fluentui/react-radio';

import type { RadioProps, RadioState } from './Radio.types';
import { toDataAttributeValue } from '../../../utils';
import { useRadioGroupSelection } from '../radioGroupSelectionContext';

/**
 * Returns the state for a Radio component, given its props and ref.
 * The returned state can be modified with hooks before being passed to `renderRadio`.
 */
export const useRadio = (props: RadioProps, ref: React.Ref<HTMLInputElement>): RadioState => {
  const state: RadioState = useRadioBase_unstable(props, ref);
  const selection = useRadioGroupSelection();
  const [localChecked, setLocalChecked] = useControllableState<boolean>({
    state: undefined,
    defaultState: state.input.defaultChecked,
    initialState: false,
  });

  // eslint-disable-next-line react-hooks/immutability
  state.input.onChange = mergeCallbacks(state.input.onChange, (ev: React.ChangeEvent<HTMLInputElement>) =>
    setLocalChecked(ev.currentTarget.checked),
  );

  // Precedence: explicit input `checked`, then the headless group's selection, then local state.
  const checked =
    state.input.checked !== undefined
      ? state.input.checked
      : selection?.selectedValue !== undefined
      ? selection.selectedValue === props.value
      : localChecked;

  // Set data attribute for checked state to simplify styling.
  // eslint-disable-next-line react-hooks/immutability
  state.root['data-checked'] = toDataAttributeValue(checked);
  // Set data attribute for disabled state to simplify styling.
  // eslint-disable-next-line react-hooks/immutability
  state.root['data-disabled'] = toDataAttributeValue(state.input.disabled);
  // eslint-disable-next-line react-hooks/immutability
  state.root['data-label-position'] = state.labelPosition;

  return state;
};
