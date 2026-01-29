'use client';

import * as React from 'react';
import { ARIAButtonSlotProps, useARIAButtonProps } from '@fluentui/react-aria';
import { getIntrinsicElementProps, slot, useHover_unstable } from '@fluentui/react-utilities';
import { usePointerInteractions_unstable } from '@fluentui/react-shared-contexts';
import type { ButtonBaseProps, ButtonBaseState } from './Button.types';

/**
 * Given user props, defines default props for the Button, calls useButtonState, and returns processed state.
 * @param props - User provided props to the Button component.
 * @param ref - User provided ref to be passed to the Button component.
 */
export const useButtonBase_unstable = (
  props: ButtonBaseProps,
  ref: React.Ref<HTMLButtonElement | HTMLAnchorElement>,
): ButtonBaseState => {
  const { as = 'button', disabled = false, disabledFocusable = false, icon, iconPosition = 'before' } = props;
  const iconShorthand = slot.optional(icon, { elementType: 'span' });

  // Check if pointer-aware hover behavior is enabled via FluentProvider
  const { usePointerHover } = usePointerInteractions_unstable();

  // Use pointer-aware hover hook - disabled when feature flag is off or button is disabled
  const { hoverProps, isHovered } = useHover_unstable({
    isDisabled: !usePointerHover || disabled || disabledFocusable,
  });

  // Get base ARIA button props
  const ariaButtonProps = useARIAButtonProps(props.as, props);

  // Merge hover props with ARIA button props when pointer hover is enabled
  const mergedProps = usePointerHover
    ? {
        ...ariaButtonProps,
        ...hoverProps,
        // Merge event handlers - ensure both hover and aria handlers are called
        onPointerEnter: (e: React.PointerEvent<HTMLButtonElement & HTMLAnchorElement>) => {
          hoverProps.onPointerEnter?.(e as React.PointerEvent<HTMLElement>);
          ariaButtonProps.onPointerEnter?.(e);
        },
        onPointerLeave: (e: React.PointerEvent<HTMLButtonElement & HTMLAnchorElement>) => {
          hoverProps.onPointerLeave?.(e as React.PointerEvent<HTMLElement>);
          ariaButtonProps.onPointerLeave?.(e);
        },
        // Add data-hovered attribute for CSS styling when hovered
        'data-hovered': isHovered ? '' : undefined,
      }
    : ariaButtonProps;

  return {
    // Props passed at the top-level
    disabled,
    disabledFocusable,
    iconPosition,
    iconOnly: Boolean(iconShorthand?.children && !props.children),
    isHovered,
    // Slots definition
    components: { root: 'button', icon: 'span' },
    root: slot.always<ARIAButtonSlotProps<'a'>>(getIntrinsicElementProps(as, mergedProps), {
      elementType: 'button',
      defaultProps: {
        ref: ref as React.Ref<HTMLButtonElement & HTMLAnchorElement>,
        type: as === 'button' ? 'button' : undefined,
      },
    }),
    icon: iconShorthand,
  };
};
