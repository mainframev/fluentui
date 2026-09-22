'use client';

import * as React from 'react';
import { Checkbox, type CheckboxProps } from '@fluentui/react-headless-components-preview/checkbox';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { toggleIndicator, toggleInput, toggleRoot } from './styles';
import { docsControlTokens } from './tokens';

export const DocsCheckbox: ForwardRefComponent<Omit<CheckboxProps, 'input' | 'indicator'>> = React.forwardRef(
  (props, ref) => (
    <Checkbox
      {...props}
      ref={ref}
      className={`${toggleRoot} ${props.className ?? ''}`}
      style={{ ...docsControlTokens, ...props.style }}
      input={{ className: toggleInput }}
      indicator={{
        className: `${toggleIndicator} w-docs-indicator rounded-docs`,
        children: (
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-full fill-none stroke-current opacity-0 group-data-checked:opacity-100"
          >
            <path d="m3 8 3 3 7-7" strokeWidth="2" />
          </svg>
        ),
      }}
    />
  ),
);

DocsCheckbox.displayName = 'DocsCheckbox';
