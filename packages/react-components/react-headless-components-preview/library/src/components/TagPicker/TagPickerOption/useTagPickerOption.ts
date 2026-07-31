'use client';

import type * as React from 'react';
import { slot } from '@fluentui/react-utilities';
import { optionClassNames } from '@fluentui/react-combobox';
import type { OptionProps } from '@fluentui/react-combobox';

import { useOption } from '../../Dropdown/Option';
import type { TagPickerOptionProps, TagPickerOptionState } from './TagPickerOption.types';

/**
 * Returns the state for a headless TagPickerOption.
 *
 */
export const useTagPickerOption = (props: TagPickerOptionProps, ref: React.Ref<HTMLElement>): TagPickerOptionState => {
  const { media, secondaryContent, ...optionProps } = props;
  // TagPickerOptionProps is a structural subtype of OptionProps:
  //   value: string satisfies value?: string, disabled? is identical, the
  //   text/children discriminated union is identical, and the root slot HTML props
  //   resolve to the same shape. TypeScript cannot prove this across the ComponentProps<>
  //   generic boundary, so a single widening assertion is used here.
  const optionState = useOption(optionProps as OptionProps, ref);

  /* eslint-disable react-hooks/immutability -- decorate the base option state */
  // optionClassNames.root MUST be present on every option element.
  // The upstream useTagPickerBase_unstable active-descendant controller uses
  //   matchOption: el => el.classList.contains(optionClassNames.root)
  // to discover navigable options. Removing or replacing this class would silently
  // break arrow-key navigation in the TagPicker dropdown.
  optionState.root.className = optionState.root.className
    ? `${optionClassNames.root} ${optionState.root.className}`
    : optionClassNames.root;

  // Force the listbox option role: the base option uses role="menuitemcheckbox" in multiselect mode,
  // but a TagPickerList is a listbox, so its options must be role="option" (mirrors v9's TagPickerOption).
  optionState.root.role = 'option';
  optionState.root['aria-checked'] = props['aria-checked'];
  /* eslint-enable react-hooks/immutability */

  return {
    ...optionState,
    components: {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      ...optionState.components,
      media: 'div',
      secondaryContent: 'span',
    },
    media: slot.optional(media, { elementType: 'div' }),
    secondaryContent: slot.optional(secondaryContent, { elementType: 'span' }),
  };
};
