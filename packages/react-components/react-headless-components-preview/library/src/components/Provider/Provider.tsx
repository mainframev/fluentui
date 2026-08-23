'use client';

import * as React from 'react';
import type { RefAttributes } from '@fluentui/react-utilities';

import { renderProvider } from './renderProvider';
import { useProvider } from './useProvider';
import type { ProviderProps } from './Provider.types';
import { useProviderContextValues } from './useProviderContextValues';

/**
 * Renders required context providers for Fluent Headless Components.
 */
// NOTE: the type annotation is explicit so declaration emit does not reference `./Provider.types` through an
// inline `import('./Provider.types')` type, which api-extractor turns into a relative import in the `.d.ts`
// rollup (see https://github.com/microsoft/rushstack/issues/3335).
// It intentionally spells out the shape React already inferred here instead of using `ForwardRefComponent`:
// `ForwardRefComponent` adds the polymorphic `as` prop handling and would change the published API surface.
export const Provider: React.ForwardRefExoticComponent<ProviderProps & RefAttributes<HTMLDivElement>> =
  React.forwardRef<HTMLDivElement, ProviderProps>((props, ref) => {
    const state = useProvider(props, ref);
    const contextValues = useProviderContextValues(state);

    return renderProvider(state, contextValues);
  });

Provider.displayName = 'Provider';
