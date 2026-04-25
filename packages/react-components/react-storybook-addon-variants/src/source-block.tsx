import * as React from 'react';
import { Source } from '@storybook/addon-docs/blocks';
import { ThemeProvider, ensure, themes } from 'storybook/internal/theming';

import type { VariantsParameter } from './public-types';
import { getExpansion, getSelection, subscribe, subscribeExpansion } from './variant-store';

type SourceBlockProps = {
  storyId: string;
  params: VariantsParameter;
};

/**
 * The outlet is mounted as its own React root (see `mountSourceOutlet` in
 * `variant-injector.ts`), so it has no `ThemeProvider` from the docs page
 * tree. Storybook's `<Source>` reads `theme.typography.fonts.mono` via styled
 * components — we provide the dark theme it expects when rendered with
 * `dark`, matching the visual style of Storybook's auto Source panel.
 */
const SOURCE_THEME = ensure(themes.dark);

export const SourceBlock: React.FC<SourceBlockProps> = ({ storyId, params }) => {
  const subSelection = React.useCallback((cb: () => void) => subscribe(storyId, cb), [storyId]);
  const getSelectionSnapshot = React.useCallback(() => getSelection(storyId, params), [storyId, params]);
  const subExpansion = React.useCallback((cb: () => void) => subscribeExpansion(storyId, cb), [storyId]);
  const getExpansionSnapshot = React.useCallback(() => getExpansion(storyId), [storyId]);

  const selection = React.useSyncExternalStore(subSelection, getSelectionSnapshot, getSelectionSnapshot);
  const expanded = React.useSyncExternalStore(subExpansion, getExpansionSnapshot, getExpansionSnapshot);

  if (!expanded) return null;

  const file = params[selection.variant]?.files.find(f => f.name === selection.file);
  if (!file) return null;

  return (
    <ThemeProvider theme={SOURCE_THEME}>
      <div className="sb-variants-source">
        <Source key={`${selection.variant}/${file.name}`} code={file.source} language={file.language as never} dark />
      </div>
    </ThemeProvider>
  );
};
