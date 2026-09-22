'use client';

import * as React from 'react';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { docsControlTokens } from './DocsControls';
import { palette } from './DocsControls/styles';

export const DocsTypeTable: ForwardRefComponent<React.ComponentProps<typeof TypeTable>> = React.forwardRef(
  (props, ref) => (
    <TypeTable
      {...props}
      ref={ref}
      className={`${palette} bg-[var(--docs-bg)] [&>div[data-state=open]]:bg-[var(--docs-bg)] ${props.className ?? ''}`}
      style={{ ...docsControlTokens, ...props.style }}
    />
  ),
);

DocsTypeTable.displayName = 'DocsTypeTable';
