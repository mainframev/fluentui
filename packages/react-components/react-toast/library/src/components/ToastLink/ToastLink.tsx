import * as React from 'react';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useToastLink_unstable } from './useToastLink';
import { renderToastLink_unstable } from './renderToastLink';
import { useToastLinkStyles_unstable } from './useToastLinkStyles.styles';
import type { ToastLinkProps } from './ToastLink.types';

/**
 * ToastLink is a specialized Link component optimized for use within Toast components.
 *
 * When used inside a Toast with `appearance="inverted"`, it automatically applies
 * `colorBrandForegroundInverted` token for better visual hierarchy and contrast,
 * while still allowing customization via className or inline styles.
 *
 * @example
 * Basic usage in inverted Toast
 * ```tsx
 * <Toast appearance="inverted">
 *   <ToastTitle action={<ToastLink>Undo</ToastLink>}>Email sent</ToastTitle>
 *   <ToastBody>Your email has been sent successfully.</ToastBody>
 *   <ToastFooter>
 *     <ToastLink>Action</ToastLink>
 *   </ToastFooter>
 * </Toast>
 * ```
 *
 * @example
 * With custom styling override
 * ```tsx
 * <Toast appearance="inverted">
 *   <ToastFooter>
 *     <ToastLink className={styles.customLink}>Custom Color</ToastLink>
 *   </ToastFooter>
 * </Toast>
 * ```
 */
export const ToastLink: ForwardRefComponent<ToastLinkProps> = React.forwardRef((props, ref) => {
  const state = useToastLink_unstable(props, ref);

  useToastLinkStyles_unstable(state);

  /**
   * @see https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/custom-styling.md
   *
   * TODO: 💡 once package will become stable (PR which will be part of promoting PREVIEW package to STABLE),
   *      - uncomment this line
   *      - update types {@link file://./../../../../../../../packages/react-components/react-shared-contexts/library/src/CustomStyleHooksContext/CustomStyleHooksContext.ts#CustomStyleHooksContextValue}
   *      - verify that custom global style override works for your component
   */
  // useCustomStyleHook_unstable('useToastLinkStyles_unstable')(state);

  return renderToastLink_unstable(state);
});

ToastLink.displayName = 'ToastLink';
