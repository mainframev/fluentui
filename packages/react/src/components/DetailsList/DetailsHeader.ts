import * as React from 'react';
import { styled } from '../../Utilities';
import { DetailsHeaderBase } from './DetailsHeader.base';
import { getDetailsHeaderStyles } from './DetailsHeader.styles';
import type {
  IDetailsHeaderProps,
  IDetailsHeaderBaseProps,
  IDetailsHeaderStyleProps,
  IDetailsHeaderStyles,
} from './DetailsHeader.types';

export const DetailsHeader: React.FunctionComponent<React.PropsWithChildren<IDetailsHeaderBaseProps>> = styled<
  IDetailsHeaderBaseProps,
  IDetailsHeaderStyleProps,
  IDetailsHeaderStyles
>(DetailsHeaderBase, getDetailsHeaderStyles, undefined, { scope: 'DetailsHeader' });

export type { IDetailsHeaderProps, IDetailsHeaderBaseProps };
