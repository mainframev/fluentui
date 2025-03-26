import * as React from 'react';
import { styled } from '../../../Utilities';
import { ColorSliderBase } from './ColorSlider.base';
import { getStyles } from './ColorSlider.styles';
import type { IColorSliderProps, IColorSliderStyleProps, IColorSliderStyles } from './ColorSlider.types';

export const ColorSlider: React.FunctionComponent<React.PropsWithChildren<IColorSliderProps>> = styled<
  IColorSliderProps,
  IColorSliderStyleProps,
  IColorSliderStyles
>(ColorSliderBase, getStyles, undefined, { scope: 'ColorSlider' });
