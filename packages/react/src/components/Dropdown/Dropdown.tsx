import * as React from 'react';
import { styled } from '../../Utilities';
import { DropdownBase } from './Dropdown.base';
import { getStyles } from './Dropdown.styles';
import type { IDropdownProps, IDropdownStyleProps, IDropdownStyles } from './Dropdown.types';

export const Dropdown: React.FunctionComponent<React.PropsWithChildren<IDropdownProps>> = styled<
  IDropdownProps,
  IDropdownStyleProps,
  IDropdownStyles
>(DropdownBase, getStyles, undefined, {
  scope: 'Dropdown',
});
Dropdown.displayName = 'Dropdown';
