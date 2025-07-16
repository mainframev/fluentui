import { addDemoActionButton } from '../sandbox-factory';

import { StoryContext } from '../types';

export const withExportToSandboxButton = (
  storyFn: (context: StoryContext) => JSX.Element,
  // eslint-disable-line @typescript-eslint/no-deprecated
  context: StoryContext,
) => {
  if (context.viewMode === 'docs' && typeof window !== 'undefined') {
    const docsSelector = `#anchor--${context.id} .docs-story`;
    const observer = new MutationObserver(() => {
      const doc = document.querySelector(docsSelector);
      if (doc) {
        addDemoActionButton(context);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  return storyFn(context);
};
