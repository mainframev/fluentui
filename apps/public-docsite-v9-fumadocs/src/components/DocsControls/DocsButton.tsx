'use client';

import * as React from 'react';
import { Button, type ButtonProps } from '@fluentui/react-headless-components-preview/button';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { field, palette } from './styles';
import { docsControlTokens } from './tokens';

export const DocsButton: ForwardRefComponent<ButtonProps> = React.forwardRef((props, ref) => (
  <Button
    {...props}
    ref={ref}
    className={`${palette} ${field} inline-flex cursor-pointer items-center justify-center gap-docs-gap transition-[background-color,color,border-color,box-shadow] duration-[var(--docs-duration)] ease-docs motion-reduce:transition-none enabled:hover:bg-docs-fg enabled:hover:text-docs-bg enabled:active:shadow-[inset_0_0_0_var(--docs-focus)_var(--docs-muted)] ${
      props.className ?? ''
    }`}
    style={{ ...docsControlTokens, ...props.style }}
  />
));

DocsButton.displayName = 'DocsButton';
