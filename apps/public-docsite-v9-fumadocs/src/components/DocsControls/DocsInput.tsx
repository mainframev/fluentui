'use client';

import * as React from 'react';
import { Input, type InputProps } from '@fluentui/react-headless-components-preview/input';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { field, palette } from './styles';
import { docsControlTokens } from './tokens';

export const DocsInput: ForwardRefComponent<Omit<InputProps, 'input'>> = React.forwardRef((props, ref) => (
  <Input
    {...props}
    ref={ref}
    className={`${palette} inline-flex min-w-0 ${props.className ?? ''}`}
    style={{ ...docsControlTokens, ...props.style }}
    input={{ className: `${field} w-full placeholder:text-docs-muted` }}
  />
));

DocsInput.displayName = 'DocsInput';
