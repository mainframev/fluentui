'use client';

import * as React from 'react';
import { useEventCallback } from './useEventCallback';
import { canUseDOM } from '../ssr/canUseDOM';
import { elementContains } from '../virtualParent/elementContains';

/**
 * The type of pointer that triggered the hover event.
 * Touch is intentionally excluded as hover is not a valid interaction for touch devices.
 */
export type PointerType = 'mouse' | 'pen';

/**
 * Event object passed to hover event handlers.
 */
export interface HoverEvent {
  /** The type of hover event. */
  type: 'hoverstart' | 'hoverend';
  /** The pointer type that triggered the event. */
  pointerType: PointerType;
  /** The target element. */
  target: HTMLElement;
}

/**
 * Props for the useHover hook.
 */
export interface HoverProps {
  /** Whether hover events should be disabled. */
  isDisabled?: boolean;
  /** Handler called when a hover interaction starts. */
  onHoverStart?: (e: HoverEvent) => void;
  /** Handler called when a hover interaction ends. */
  onHoverEnd?: (e: HoverEvent) => void;
  /** Handler called when the hover state changes. */
  onHoverChange?: (isHovered: boolean) => void;
}

/**
 * Result returned by the useHover hook.
 */
export interface HoverResult {
  /** Props to spread on the target element. */
  hoverProps: React.DOMAttributes<HTMLElement>;
  /** Whether the element is currently hovered. */
  isHovered: boolean;
}

// Global state for ignoring emulated mouse events after touch.
// iOS fires onPointerEnter twice: once with pointerType="touch" and again with pointerType="mouse".
// We want to ignore these emulated events so they do not trigger hover behavior.
// See https://bugs.webkit.org/show_bug.cgi?id=214609
let globalIgnoreEmulatedMouseEvents = false;
let hoverCount = 0;

function setGlobalIgnoreEmulatedMouseEvents() {
  globalIgnoreEmulatedMouseEvents = true;

  // Clear globalIgnoreEmulatedMouseEvents after a short timeout. iOS fires onPointerEnter
  // with pointerType="mouse" immediately after onPointerUp and before onFocus. On other
  // devices that don't have this quirk, we don't want to ignore a mouse hover sometime in
  // the distant future because a user previously touched the element.
  setTimeout(() => {
    globalIgnoreEmulatedMouseEvents = false;
  }, 50);
}

function handleGlobalPointerEvent(e: PointerEvent) {
  if (e.pointerType === 'touch') {
    setGlobalIgnoreEmulatedMouseEvents();
  }
}

function setupGlobalTouchEvents() {
  if (!canUseDOM()) {
    return;
  }

  if (hoverCount === 0) {
    document.addEventListener('pointerup', handleGlobalPointerEvent);
  }

  hoverCount++;

  return () => {
    hoverCount--;
    if (hoverCount === 0) {
      document.removeEventListener('pointerup', handleGlobalPointerEvent);
    }
  };
}

/**
 * Handles pointer hover interactions for an element. Normalizes behavior
 * across browsers and platforms, and ignores emulated mouse events on touch devices.
 *
 * This hook only triggers hover for mouse and pen pointer types, never for touch.
 * This fixes the "sticky hover" problem on touch devices where CSS :hover persists
 * after tapping an element.
 *
 * @param props - Props for the hover interaction
 * @returns Hover state and props to spread on the target element
 */
export function useHover_unstable(props: HoverProps): HoverResult {
  const { onHoverStart, onHoverChange, onHoverEnd, isDisabled } = props;

  const [isHovered, setHovered] = React.useState(false);
  const state = React.useRef({
    isHovered: false,
    pointerType: '' as string,
    target: null as HTMLElement | null,
  });

  // Setup/teardown global touch event listener
  React.useEffect(setupGlobalTouchEvents, []);

  // Ref to store cleanup function for global pointerover listener
  const removePointerOverListener = React.useRef<(() => void) | null>(null);

  const triggerHoverEnd = useEventCallback((pointerType: string) => {
    const target = state.current.target;
    state.current.pointerType = '';
    state.current.target = null;

    if (pointerType === 'touch' || !state.current.isHovered || !target) {
      return;
    }

    state.current.isHovered = false;

    // Cleanup global listener
    removePointerOverListener.current?.();
    removePointerOverListener.current = null;

    onHoverEnd?.({
      type: 'hoverend',
      target,
      pointerType: pointerType as PointerType,
    });

    onHoverChange?.(false);
    setHovered(false);
  });

  const triggerHoverStart = useEventCallback((event: React.PointerEvent<HTMLElement>, pointerType: string) => {
    state.current.pointerType = pointerType;

    if (
      isDisabled ||
      pointerType === 'touch' ||
      state.current.isHovered ||
      !elementContains(event.currentTarget, event.target as HTMLElement)
    ) {
      return;
    }

    state.current.isHovered = true;
    state.current.target = event.currentTarget;

    // When an element that is hovered over is removed, no pointerleave event is fired by the browser,
    // even though the originally hovered target may have shrunk in size so it is no longer hovered.
    // However, a pointerover event will be fired on the new target the mouse is over.
    // We use this to detect when hover should end due to element removal.
    const doc = event.currentTarget.ownerDocument;
    const onPointerOver = (e: PointerEvent) => {
      if (
        state.current.isHovered &&
        state.current.target &&
        !elementContains(state.current.target, e.target as HTMLElement)
      ) {
        triggerHoverEnd(e.pointerType);
      }
    };

    doc.addEventListener('pointerover', onPointerOver, true);
    removePointerOverListener.current = () => {
      doc.removeEventListener('pointerover', onPointerOver, true);
    };

    onHoverStart?.({
      type: 'hoverstart',
      target: event.currentTarget,
      pointerType: pointerType as PointerType,
    });

    onHoverChange?.(true);
    setHovered(true);
  });

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      removePointerOverListener.current?.();
    };
  }, []);

  // End hover when disabled changes to true
  React.useEffect(() => {
    if (isDisabled && state.current.isHovered) {
      triggerHoverEnd(state.current.pointerType);
    }
  }, [isDisabled, triggerHoverEnd]);

  const hoverProps = React.useMemo<React.DOMAttributes<HTMLElement>>(
    () => ({
      onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
        // Ignore emulated mouse events after touch
        if (globalIgnoreEmulatedMouseEvents && e.pointerType === 'mouse') {
          return;
        }
        triggerHoverStart(e, e.pointerType as PointerType);
      },
      onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
        if (!isDisabled && elementContains(e.currentTarget, e.target as HTMLElement)) {
          triggerHoverEnd(e.pointerType);
        }
      },
    }),
    [isDisabled, triggerHoverStart, triggerHoverEnd],
  );

  return {
    hoverProps,
    isHovered,
  };
}
