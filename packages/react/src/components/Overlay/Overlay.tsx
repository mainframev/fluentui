import * as React from 'react';
import { styled } from '../../Utilities';
import { OverlayBase } from './Overlay.base';
import { getStyles } from './Overlay.styles';
import type { IOverlayProps, IOverlayStyleProps, IOverlayStyles } from './Overlay.types';

export const Overlay: React.FunctionComponent<React.PropsWithChildren<IOverlayProps>> = styled<
  IOverlayProps,
  IOverlayStyleProps,
  IOverlayStyles
>(OverlayBase, getStyles, undefined, {
  scope: 'Overlay',
});
