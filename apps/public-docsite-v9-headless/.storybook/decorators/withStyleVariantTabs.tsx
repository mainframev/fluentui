import * as React from 'react';
import { readStoredVariant, STYLE_VARIANT_ARG, type StyleVariant } from './StyleVariantContext';

const TAILWIND_CDN = '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>';

export const withStyleVariantTabs = (StoryFn: React.ComponentType, context: Record<string, any>) => {
  const variants = context.parameters?.headlessVariants;
  const argVariant = context.args?.[STYLE_VARIANT_ARG] as StyleVariant | undefined;
  const variant: StyleVariant = argVariant ?? readStoredVariant();

  if (variants?.css && variant === 'css') {
    context.parameters.fullSource = variants.css.source;
    return React.createElement(variants.css.component);
  }

  if (variants?.tailwind?.source) {
    context.parameters.fullSource = variants.tailwind.source;
  }

  context.parameters.exportToSandbox = {
    ...context.parameters.exportToSandbox,
    htmlHeadExtra: TAILWIND_CDN,
  };

  return <StoryFn />;
};
