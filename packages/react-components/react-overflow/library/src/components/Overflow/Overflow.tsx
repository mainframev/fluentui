'use client';

import * as React from 'react';
import type { RefAttributes } from '@fluentui/react-utilities';
import type { OverflowProps } from './Overflow.types';
import { useOverflow_unstable } from './useOverflow';
import { useOverflowContextValues_unstable } from '../../useOverflowContextValues';
import { useOverflowStyles_unstable } from './useOverflowStyles.styles';
import { renderOverflow_unstable } from './renderOverflow';

/**
 * Provides an OverflowContext for OverflowItem descendants.
 */
// NOTE: the type annotation is explicit so declaration emit does not reference `./Overflow.types` through an
// inline `import('./Overflow.types')` type, which api-extractor turns into a relative import in the `.d.ts`
// rollup (see https://github.com/microsoft/rushstack/issues/3335).
// It intentionally spells out the shape React already inferred here instead of using `ForwardRefComponent`:
// `ForwardRefComponent` adds the polymorphic `as` prop handling and would change the published API surface.
export const Overflow: React.ForwardRefExoticComponent<OverflowProps & RefAttributes<unknown>> = React.forwardRef(
  (props: OverflowProps, ref) => {
    const state = useOverflow_unstable(props, ref as React.Ref<HTMLElement>);
    const contextValues = useOverflowContextValues_unstable(state);

    useOverflowStyles_unstable(state);

    return renderOverflow_unstable(state, contextValues);
  },
);
