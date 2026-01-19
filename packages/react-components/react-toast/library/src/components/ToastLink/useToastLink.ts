import * as React from 'react';
import { useLink_unstable } from '@fluentui/react-link';
import type { ToastLinkProps, ToastLinkState } from './ToastLink.types';

/**
 * Create the state required to render ToastLink.
 * Simply delegates to the base Link component's state hook.
 *
 * The returned state can be modified with hooks such as useToastLinkStyles_unstable,
 * before being passed to renderToastLink_unstable.
 *
 * @param props - props from this instance of ToastLink
 * @param ref - reference to root HTMLElement of ToastLink
 */
export const useToastLink_unstable = (
  props: ToastLinkProps,
  ref: React.Ref<HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement>,
): ToastLinkState => {
  // Simply delegate to base Link hook - no custom logic needed
  return useLink_unstable(props, ref);
};
