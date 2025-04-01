import * as React from 'react';
import type { IBaseFloatingPickerProps } from '../../../../FloatingPicker';
import type { ISelectedPeopleItemProps, IExtendedPersonaProps } from '../SelectedPeopleList';
import type { IPersonaProps } from '../../../../Persona';
import type { IStyle } from '../../../../Styling';

export interface IEditingSelectedPeopleItemProps extends ISelectedPeopleItemProps {
  onEditingComplete: (oldItem: any, newItem: any) => void;
  onRenderFloatingPicker?: React.ComponentType<React.PropsWithChildren<IBaseFloatingPickerProps<IPersonaProps>>>;
  floatingPickerProps?: IBaseFloatingPickerProps<IPersonaProps>;
  getEditingItemText?: (item: IExtendedPersonaProps) => string;
}

export interface IEditingSelectedPeopleItemStylesProps {}

export interface IEditingSelectedPeopleItemStyles {
  root: IStyle;
  input: IStyle;
}
