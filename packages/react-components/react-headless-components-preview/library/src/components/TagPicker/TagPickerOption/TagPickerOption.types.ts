import type * as React from 'react';
import type { ComponentProps, ComponentState, Slot } from '@fluentui/react-utilities';
import type { OptionProps, OptionSlots, OptionState } from '../../Dropdown/Option';

// Only the root slot is surfaced in TagPickerOptionSlots.
// checkIcon (the other OptionSlots member) is an internal rendering detail managed by
// useOption / useOptionBase_unstable; exposing it here would force every consumer to
// supply it, and it is not part of the upstream TagPickerOption public API.
export type TagPickerOptionSlots = Pick<OptionSlots, 'root'> & {
  /**
   * Media rendered before the option's text content (e.g. an avatar or icon).
   */
  media?: Slot<'div'>;
  /**
   * Secondary text rendered after the option's text content.
   */
  secondaryContent?: Slot<'span'>;
};

/**
 * TagPickerOption Props
 *
 * Mirrors the public shape of the styled @fluentui/react-tag-picker TagPickerOption:
 * - `value` is required so that the upstream useTagPickerBase_unstable active-descendant
 *   controller can track and navigate options by value.
 * - The discriminated `text`/`children` union ensures display text is always resolvable
 *   for type-ahead matching and combobox input population.
 * - `disabled` is forwarded to useOption so disabled options cannot be selected.
 */
export type TagPickerOptionProps = ComponentProps<TagPickerOptionSlots> &
  Pick<OptionProps, 'disabled'> & {
    /** Unique string value for this option, used to track selection state. */
    value: string;
  } & (
    | {
        /**
         * An optional override for the option's display text, defaulting to the child string.
         * Used for type-ahead matching and combobox input population.
         */
        text?: string;
        children: string;
      }
    | {
        /**
         * Required when children is not a plain string.
         * Used for type-ahead matching and combobox input population.
         */
        text: string;
        children?: React.ReactNode;
      }
  );

/**
 * State used in rendering the headless TagPickerOption.
 * OptionState is retained (rather than the narrower upstream state) so that
 * disabled/selected/checkIcon rendering from useOption is available at render time.
 */
export type TagPickerOptionState = OptionState & ComponentState<TagPickerOptionSlots>;
