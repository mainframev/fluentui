import type { RadioGroupBaseState } from '@fluentui/react-radio';

export type {
  RadioGroupSlots,
  RadioGroupBaseProps as RadioGroupProps,
  RadioGroupContextValues,
} from '@fluentui/react-radio';

/**
 * State used in rendering RadioGroup
 */
export type RadioGroupState = RadioGroupBaseState & {
  /**
   * The currently selected value, tracked for both controlled and uncontrolled groups.
   */
  selectedValue: string | undefined;
};
