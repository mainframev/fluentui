import * as React from 'react';
import { styled } from '../../Utilities';
import { getStyles } from './Shimmer.styles';
import { ShimmerBase } from './Shimmer.base';
import type { IShimmerProps, IShimmerStyleProps, IShimmerStyles } from './Shimmer.types';

export const Shimmer: React.FunctionComponent<React.PropsWithChildren<IShimmerProps>> = styled<
  IShimmerProps,
  IShimmerStyleProps,
  IShimmerStyles
>(ShimmerBase, getStyles, undefined, {
  scope: 'Shimmer',
});
