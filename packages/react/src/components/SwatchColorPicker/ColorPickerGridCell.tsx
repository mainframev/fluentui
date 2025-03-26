import * as React from 'react';
import { styled } from '../../Utilities';
import { ColorPickerGridCellBase } from './ColorPickerGridCell.base';
import { getStyles } from './ColorPickerGridCell.styles';
import type {
  IColorPickerGridCellProps,
  IColorPickerGridCellStyleProps,
  IColorPickerGridCellStyles,
} from './ColorPickerGridCell.types';

export const ColorPickerGridCell: React.FunctionComponent<React.PropsWithChildren<IColorPickerGridCellProps>> = styled<
  IColorPickerGridCellProps,
  IColorPickerGridCellStyleProps,
  IColorPickerGridCellStyles
>(ColorPickerGridCellBase, getStyles, undefined, { scope: 'ColorPickerGridCell' }, true);
