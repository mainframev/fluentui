import * as React from 'react';
import { styled } from '@fluentui/react';
import { PlatformBarBase } from './PlatformBar.base';
import { IPlatformBarProps, IPlatformBarStyleProps, IPlatformBarStyles } from './PlatformBar.types';
import { getStyles } from './PlatformBar.styles';

export const PlatformBar: React.FunctionComponent<React.PropsWithChildren<IPlatformBarProps>> = styled<
  IPlatformBarProps,
  IPlatformBarStyleProps,
  IPlatformBarStyles
>(PlatformBarBase, getStyles, undefined, {
  scope: 'PlatformBar',
});
