import type { ComponentState, Slot } from '@fluentui/react-utilities';
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
 * Extends OptionProps directly so that the type is a structural subtype of OptionProps
 * and can be passed to `useOption` without any assertion or runtime guard. This also
 * ensures that any new required fields added to OptionProps automatically surface in
 * TagPickerOptionProps and cause a compile error if omitted by consumers.
 *
 * - The OptionProps base provides root HTML attributes, `disabled`, the text/children
 *   discriminated union, and `checkIcon` (which remains optional and internal — it is
 *   NOT included in TagPickerOptionSlots so it does not appear in state or rendering).
 *   The styled @fluentui/react-tag-picker TagPickerOption does not surface `disabled`
 *   in its own props definition, but the headless layer intentionally exposes it (via
 *   OptionProps) so consumers can mark individual options as disabled without workarounds.
 * - `value` is narrowed from optional to required so the active-descendant controller
 *   can track options by value.
 * - `media` and `secondaryContent` are additional TagPickerOption-specific slots.
 */
export type TagPickerOptionProps = OptionProps & {
  /** Unique string value for this option, used to track selection state. */
  value: string;
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
 * State used in rendering the headless TagPickerOption.
 * OptionState is retained (rather than the narrower upstream state) so that
 * disabled/selected/checkIcon rendering from useOption is available at render time.
 */
export type TagPickerOptionState = OptionState & ComponentState<TagPickerOptionSlots>;
