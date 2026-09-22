'use client';

import { teamsDarkTheme, teamsLightTheme, webDarkTheme, webLightTheme } from '@fluentui/react-theme';
import * as React from 'react';

import { PreviewSettingsProvider, type TextDirection } from './StoryPreview';
import { DocsLabel, DocsSelect, DocsSwitch } from './DocsControls';

export const THEMES = {
  'web-light': { label: 'Web Light', theme: webLightTheme },
  'web-dark': { label: 'Web Dark', theme: webDarkTheme },
  'teams-light': { label: 'Teams Light', theme: teamsLightTheme },
  'teams-dark': { label: 'Teams Dark', theme: teamsDarkTheme },
} as const;

export type ThemeId = keyof typeof THEMES;

const STORAGE_KEY = 'fluentui-docsite-preview-settings';
const DEFAULT_THEME: ThemeId = 'web-light';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES;
}

export interface DocsSettingsProviderProps {
  children: React.ReactNode;
  /** Omit the theme picker for trees where theming does not apply (e.g. headless). */
  showThemePicker?: boolean;
  /**
   * Page-level actions, placed at the end of the settings row rather than on their own line.
   * Stacking them cost three lines of vertical space above every page's first example.
   */
  actions?: React.ReactNode;
  /** Page introduction below the settings, within the shared preview context. */
  introduction?: React.ReactNode;
  /** Optional layout treatment for the settings row. */
  className?: string;
}

/**
 * Holds the reader's theme and text-direction choices and applies them to every preview
 * on the page (`docsite/component-page`).
 *
 * Selections persist across navigation via storage. Storage is read in an effect rather
 * than during render so prerendering stays deterministic and hydration cannot mismatch.
 */
export const DocsSettingsProvider = ({
  children,
  showThemePicker = true,
  actions,
  introduction,
  className,
}: DocsSettingsProviderProps): React.ReactElement => {
  const themeSelectId = React.useId();
  const [themeId, setThemeId] = React.useState<ThemeId>(DEFAULT_THEME);
  const [dir, setDir] = React.useState<TextDirection>('ltr');
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);

      if (!raw) {
        return;
      }

      const stored = JSON.parse(raw) as { themeId?: unknown; dir?: unknown };

      if (isThemeId(stored.themeId)) {
        // Restore browser-only preferences after hydration to match the prerendered HTML.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeId(stored.themeId);
      }

      if (stored.dir === 'ltr' || stored.dir === 'rtl') {
        setDir(stored.dir);
      }
    } catch {
      // A malformed or unavailable store must not break the page; defaults stand.
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (!settingsLoaded) {
      return;
    }
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify({ themeId, dir }));
    } catch {
      // Persistence is best-effort (private mode, disabled storage).
    }
  }, [themeId, dir, settingsLoaded]);

  const value = React.useMemo(() => ({ theme: THEMES[themeId].theme, themeId, dir }), [themeId, dir]);
  const handleThemeChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setThemeId(event.currentTarget.value as ThemeId);
  }, []);
  const handleDirectionChange = React.useCallback((_: unknown, data: { checked: boolean }) => {
    setDir(data.checked ? 'rtl' : 'ltr');
  }, []);

  return (
    <PreviewSettingsProvider value={value}>
      <div
        className={`flex flex-wrap items-center justify-between gap-x-docs-indicator gap-y-docs-gap text-docs ${
          className ?? 'my-docs-indicator'
        }`}
      >
        <div className="flex flex-wrap items-center gap-docs-indicator">
          {showThemePicker ? (
            <div className="flex items-center gap-docs-gap">
              <DocsLabel htmlFor={themeSelectId}>Theme</DocsLabel>
              <DocsSelect id={themeSelectId} value={themeId} onChange={handleThemeChange}>
                {Object.entries(THEMES).map(([id, { label }]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </DocsSelect>
            </div>
          ) : null}
          <DocsSwitch checked={dir === 'rtl'} onChange={handleDirectionChange} label="Right-to-left" />
        </div>
        {actions}
      </div>
      {introduction}
      {children}
    </PreviewSettingsProvider>
  );
};
