'use client';

import { useRadioGroupContextValues as useRadioGroupContextValues_unstable } from '@fluentui/react-radio';
import type { RadioGroupContextValues, RadioGroupState } from './RadioGroup.types';

// Headless RadioGroupState adds `selectedValue`; the base hook only reads base fields.
export const useRadioGroupContextValues = useRadioGroupContextValues_unstable as unknown as (
  state: RadioGroupState,
) => RadioGroupContextValues;
