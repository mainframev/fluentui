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

  // Render *only* the active variant. The `key` triggers a clean React
  // unmount + mount across tab switches so the previous variant's subtree
  // is fully torn out of the DOM rather than hidden alongside it. Selection
  // lives in a module-level store (not Storybook globals), so the docs
  // tree above us doesn't re-prepare on the swap — only this slot does.
  return (
    <div className="sb-variants-stage">
      <div key={selection.variant} className="sb-variants-stage__slot">
        {storyChildren(selection.variant)}
      </div>
    </div>
  );
};

/**
 * Decorator: render the active variant's component (the others stay out of
 * the DOM until selected), inject the variant tabs / file dropdown above the
 * preview, and let the separately-mounted `<SourceBlock>` outlet render the
 * controlled source code panel below the canvas.
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
