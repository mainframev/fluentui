import * as React from 'react';
import { styled } from '../../../Utilities';
import { BasePicker } from '../BasePicker';
import { getStyles } from '../BasePicker.styles';
import { TagItem } from './TagItem';
import { TagItemSuggestion } from './TagItemSuggestion';
import type { IBasePickerStyleProps, IBasePickerStyles } from '../BasePicker.types';
import type { ITagPickerProps, ITag, ITagItemProps } from './TagPicker.types';

/**
 * {@docCategory TagPicker}
 */
export class TagPickerBase extends BasePicker<ITag, ITagPickerProps> {
  public static defaultProps = {
    onRenderItem: (
      props: ITagItemProps,
    ): // eslint-disable-next-line @typescript-eslint/no-deprecated
    JSX.Element => <TagItem {...props}>{props.item.name}</TagItem>,

    onRenderSuggestionsItem: (
      props: ITag,
    ): // eslint-disable-next-line @typescript-eslint/no-deprecated
    JSX.Element => <TagItemSuggestion>{props.name}</TagItemSuggestion>,
  };
}

export const TagPicker = styled<ITagPickerProps, IBasePickerStyleProps, IBasePickerStyles>(
  TagPickerBase,
  getStyles,
  undefined,
  {
    scope: 'TagPicker',
  },
);
