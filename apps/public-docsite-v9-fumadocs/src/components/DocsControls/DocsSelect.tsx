'use client';

import * as React from 'react';
import { Select, type SelectProps } from '@fluentui/react-headless-components-preview/select';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { ChevronDown } from 'lucide-react';
import { field, palette } from './styles';
import { docsControlTokens } from './tokens';

export const DocsSelect: ForwardRefComponent<Omit<SelectProps, 'select' | 'icon'>> = React.forwardRef((props, ref) => (
  <Select
    {...props}
    ref={ref}
    className={`${palette} relative inline-flex min-w-0 ${props.className ?? ''}`}
    style={{ ...docsControlTokens, ...props.style }}
    select={{
      className: `${field} w-full cursor-pointer appearance-none pe-[calc(var(--docs-indicator)+var(--docs-gap)+var(--docs-padding-x))]`,
    }}
    icon={{
      className: 'pointer-events-none absolute end-docs-x top-1/2 flex -translate-y-1/2 text-docs-muted',
      children: <ChevronDown aria-hidden="true" className="size-docs-indicator" />,
    }}
  />
));

DocsSelect.displayName = 'DocsSelect';
