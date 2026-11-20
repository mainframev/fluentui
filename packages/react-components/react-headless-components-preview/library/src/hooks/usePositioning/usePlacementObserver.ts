'use client';

import { useIsomorphicLayoutEffect, useEventCallback } from '@fluentui/react-utilities';
import { computePosition, debounce } from './utils';

/**
 * Mirrors the placement that the browser actually resolves for an
 * anchored element into its `data-placement` attribute. Useful when CSS
 * `position-try-fallbacks` flips the surface after a layout shift, scroll,
 * or content reflow — consumers can style the surface (arrows, animations)
 * via `[data-placement^="above"]` and friends and stay in sync.
 *
 * While the surface has no box (hidden or `display: none`) only a ResizeObserver
 * stays attached; window listeners attach when it is laid out.
 */
export function usePlacementObserver(
  containerEl: HTMLElement | null,
  targetEl: HTMLElement | null,
  targetDocument: Document | undefined,
  disabled = false,
): () => void {
  const update = useEventCallback(() => {
    if (!containerEl || !targetEl) {
      return;
    }

    const result = computePosition(targetEl, containerEl);
    if (!result) {
      return;
    }

    if (containerEl.getAttribute('data-placement') !== result.placement) {
      containerEl.setAttribute('data-placement', result.placement);
    }
  });

  useIsomorphicLayoutEffect(() => {
    if (disabled || !containerEl || !targetEl) {
      return;
    }

    const win = targetDocument?.defaultView;
    if (!win) {
      return;
    }

    const debouncedUpdate = debounce(update);

    let containerLaidOut = false;
    let listening = false;

    const startListening = () => {
      if (listening) {
        return;
      }
      listening = true;
      win.addEventListener('scroll', debouncedUpdate, { capture: true, passive: true });
      win.addEventListener('resize', debouncedUpdate);
    };

    const stopListening = () => {
      if (!listening) {
        return;
      }
      listening = false;
      win.removeEventListener('scroll', debouncedUpdate, { capture: true });
      win.removeEventListener('resize', debouncedUpdate);
    };

    const ResizeObserverCtor = win.ResizeObserver;
    if (!ResizeObserverCtor) {
      // No ResizeObserver (jsdom, very old browsers): keep the previous always-on behaviour.
      startListening();
      debouncedUpdate();
      return stopListening;
    }

    const resizeObserver = new ResizeObserverCtor(entries => {
      for (const entry of entries) {
        if (entry.target === containerEl) {
          containerLaidOut = entry.contentRect.width > 0 && entry.contentRect.height > 0;
        }
      }

      if (containerLaidOut) {
        startListening();
        debouncedUpdate();
      } else {
        stopListening();
      }
    });

    resizeObserver.observe(containerEl);
    resizeObserver.observe(targetEl);

    return () => {
      resizeObserver.disconnect();
      stopListening();
    };
  }, [containerEl, targetEl, targetDocument, disabled, update]);

  return update;
}
