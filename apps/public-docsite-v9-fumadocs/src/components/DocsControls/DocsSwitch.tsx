'use client';

import * as React from 'react';
import { Switch, type SwitchProps } from '@fluentui/react-headless-components-preview/switch';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { toggleIndicator, toggleInput, toggleRoot } from './styles';
import { docsControlTokens } from './tokens';

export const DocsSwitch: ForwardRefComponent<Omit<SwitchProps, 'input' | 'indicator'>> = React.forwardRef(
  (props, ref) => (
    <Switch
      {...props}
      ref={ref}
      className={`${toggleRoot} ${props.className ?? ''}`}
      style={{ ...docsControlTokens, ...props.style }}
      input={{ className: toggleInput }}
      indicator={{
        className: `${toggleIndicator} w-docs-track rounded-docs-round transition-colors duration-[var(--docs-duration)] ease-docs motion-reduce:transition-none`,
        children: (
          <span className="absolute start-docs-inset top-1/2 size-docs-thumb -translate-y-1/2 rounded-docs-round bg-docs-muted transition-[inset-inline-start,background-color] duration-[var(--docs-duration)] ease-docs motion-reduce:transition-none group-data-checked:start-[calc(100%-var(--docs-thumb)-var(--docs-inset))] group-data-checked:bg-docs-bg" />
        ),
      }}
    />
  ),
);

DocsSwitch.displayName = 'DocsSwitch';
