import * as React from 'react';

import type { StoryContext } from '../types';
import { injectVariantBar } from '../variant-injector';
import { getSelection, subscribe } from '../variant-store';

const VariantStage: React.FC<{
  storyId: string;
  params: import('../public-types').VariantsParameter;
  storyChildren: (variantKey: string) => React.ReactNode;
}> = ({ storyId, params, storyChildren }) => {
  const subscribeFn = React.useCallback((cb: () => void) => subscribe(storyId, cb), [storyId]);
  const getSnapshot = React.useCallback(() => getSelection(storyId, params), [storyId, params]);

  const selection = React.useSyncExternalStore(subscribeFn, getSnapshot, getSnapshot);

  return (
    <div className="sb-variants-stage">
      {Object.keys(params).map(key => {
        const isActive = selection.variant === key;
        return (
          <div
            key={key}
            className="sb-variants-stage__slot"
            data-active={isActive ? 'true' : 'false'}
            aria-hidden={!isActive}
          >
            {storyChildren(key)}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Decorator: render every variant's component side-by-side in a CSS grid (so
 * switching is a `data-active` flip, no React unmount), inject the variant
 * tabs/file dropdown above the preview, and render a controlled `<Source>`
 * below the canvas that reflects the active selection.
 */
export const withVariants = (
  storyFn: (context: StoryContext) => React.ReactElement,
  context: StoryContext,
): React.ReactElement => {
  const params = context.parameters?.variants;

  if (context.viewMode === 'docs' && params) {
    injectVariantBar(context);
  }

  if (!params) {
    return storyFn(context);
  }

  const defaultStory = storyFn(context);
  const storyChildren = (key: string): React.ReactNode => {
    const config = params[key];
    return config.component ? React.createElement(config.component) : defaultStory;
  };

  return <VariantStage storyId={context.id} params={params} storyChildren={storyChildren} />;
};
