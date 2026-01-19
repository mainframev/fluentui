import { makeStyles, mergeClasses } from '@griffel/react';
import { tokens } from '@fluentui/react-theme';
import { useLinkStyles_unstable, linkClassNames } from '@fluentui/react-link';
import type { ToastLinkState } from './ToastLink.types';

// Re-use Link's classNames - no need for custom ones
export { linkClassNames as toastLinkClassNames };

/**
 * Toast-specific inverted brand color styles
 * Applied when ToastLink is rendered within an inverted Toast
 */
const useToastInvertedStyles = makeStyles({
  brandInverted: {
    color: tokens.colorBrandForegroundInverted,
    ':hover': {
      color: tokens.colorBrandForegroundInverted,
      textDecorationLine: 'underline',
    },
    ':active': {
      color: tokens.colorBrandForegroundInverted,
      textDecorationLine: 'underline',
    },
  },
});

/**
 * Apply styling to the ToastLink slots based on the state.
 *
 * This hook applies Toast-specific brand inverted colors when used within an inverted Toast,
 * while ensuring user-provided className can still override the styling.
 *
 * The className order is: [Link base styles] → [Toast brand color] → [User className]
 */
export const useToastLinkStyles_unstable = (state: ToastLinkState): ToastLinkState => {
  'use no memo';

  const toastInvertedStyles = useToastInvertedStyles();

  // CRITICAL: Save user's className before applying base Link styles
  // This allows us to re-add it at the end so it can override everything
  const userClassName = state.root.className;

  // Temporarily remove user className so base Link styles don't include it yet
  state.root.className = undefined;

  // Apply base Link styles (handles appearance, backgroundAppearance, disabled, etc.)
  useLinkStyles_unstable(state);

  // If we're in an inverted context, add Toast-specific brand color
  // This goes AFTER Link's base styles but BEFORE user's className
  if (state.backgroundAppearance === 'inverted') {
    state.root.className = mergeClasses(state.root.className, toastInvertedStyles.brandInverted);
  }

  // Finally, re-add user's className so it has the highest specificity and can override
  state.root.className = mergeClasses(state.root.className, userClassName);

  return state;
};
