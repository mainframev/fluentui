import * as React from 'react';
import type { ICalloutProps } from './Callout.types';
import { styled } from '../../Utilities';
import { CalloutContentBase } from './CalloutContent.base';
import { getStyles } from './CalloutContent.styles';

export const CalloutContent: React.FunctionComponent<React.PropsWithChildren<ICalloutProps>> = styled(
  CalloutContentBase,
  getStyles,
  undefined,
  {
    scope: 'CalloutContent',
  },
);
