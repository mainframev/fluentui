import { renderLink_unstable } from '@fluentui/react-link';
import type { ToastLinkState } from './ToastLink.types';

/**
 * Render the final JSX of ToastLink.
 * Simply delegates to the base Link component's render function.
 */
export const renderToastLink_unstable = (state: ToastLinkState) => {
  return renderLink_unstable(state);
};
