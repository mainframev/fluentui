import * as React from 'react';
import { styled } from '../../Utilities';
import { getStyles } from './Separator.styles';
import { SeparatorBase } from './Separator.base';
import type { ISeparatorProps, ISeparatorStyleProps, ISeparatorStyles } from './Separator.types';

export const Separator: React.FunctionComponent<React.PropsWithChildren<ISeparatorProps>> = styled<
  ISeparatorProps,
  ISeparatorStyleProps,
  ISeparatorStyles
>(SeparatorBase, getStyles, undefined, {
  scope: 'Separator',
});
Separator.displayName = 'Separator';
