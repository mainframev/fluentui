'use client';

import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import type { Theme } from '@fluentui/react-components';
import * as React from 'react';

export type TextDirection = 'ltr' | 'rtl';

export interface PreviewSettings {
  theme: Theme;
  themeId: string;
  dir: TextDirection;
}

const defaultPreviewSettings: PreviewSettings = {
  theme: webLightTheme,
  themeId: 'web-light',
  dir: 'ltr',
};

const PreviewSettingsContext = React.createContext<PreviewSettings | undefined>(undefined);

export const PreviewSettingsProvider = PreviewSettingsContext.Provider;

export function usePreviewSettings(): PreviewSettings {
  return React.useContext(PreviewSettingsContext) ?? defaultPreviewSettings;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  name: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Isolates a single example so one failure cannot blank the page
 * (`docsite/component-page`: "One failing example does not blank the page").
 */
class PreviewErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  public render() {
    const { error } = this.state;

    if (error) {
      return (
        <div
          role="alert"
          className="rounded-md border border-fd-destructive-border bg-fd-destructive-surface p-4 text-sm text-fd-destructive"
        >
          <p className="font-medium">This example failed to render.</p>
          <p className="mt-1 font-mono text-xs opacity-80">
            {this.props.name}: {error.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Storybook decorator: receives a component rendering the story, returns wrapped JSX. */
export type StoryDecorator = (Story: React.ComponentType) => React.ReactNode;

export interface StoryPreviewProps {
  /** A story export from a `*.stories.tsx` module. */
  story: React.ComponentType<Record<string, unknown>>;
  /** Story export name, used for anchors and error reporting. */
  name: string;
  /** Optional per-page wrapper. */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Props the reader has varied through the controls panel. */
  args?: Record<string, unknown>;
  /**
   * Decorators declared on the story module's meta.
   *
   * Applying these keeps the story module the single source of truth (design D1) — the
   * alternative was re-declaring each layout wrapper on the corresponding docs page, which
   * would drift from Storybook the moment a decorator changed.
   */
  decorators?: StoryDecorator[];
  /** Render an isolated example without the documentation preview frame. */
  standalone?: boolean;
  /** Frame styling supplied by the containing documentation example. */
  className?: string;
}

/** Applies decorators innermost-last, matching Storybook's ordering. */
function applyDecorators(content: React.ReactNode, decorators: StoryDecorator[] = []): React.ReactNode {
  return decorators.reduceRight<React.ReactNode>((acc, decorate) => decorate(() => <>{acc}</>), content);
}

/**
 * Renders a story from its module, live (design D1, D8).
 *
 * `data-fluent-preview` marks the subtree that Tailwind's preflight must not reach
 * (see app.css). Examples retain their package-owned Griffel or CSS Module styling.
 */
export const StoryPreview = ({
  story: Story,
  name,
  wrapper: Wrapper,
  decorators,
  args,
  standalone = false,
  className,
}: StoryPreviewProps): React.ReactElement => {
  const { theme, dir } = usePreviewSettings();

  const decorated = applyDecorators(<Story {...args} />, decorators);
  const content = Wrapper ? <Wrapper>{decorated}</Wrapper> : decorated;

  return (
    <div
      className={`not-prose ${
        standalone
          ? `min-h-screen ${className ?? ''}`
          : className ??
            'my-[var(--preview-gap)] rounded-[var(--preview-radius)] border-[length:var(--preview-stroke)] p-[var(--preview-padding)]'
      }`}
      style={
        {
          backgroundColor: theme.colorNeutralBackground1,
          '--preview-gap': theme.spacingVerticalL,
          '--preview-radius': theme.borderRadiusXLarge,
          '--preview-stroke': theme.strokeWidthThin,
          '--preview-padding': theme.spacingHorizontalXXL,
          ...(standalone ? { padding: `${theme.spacingVerticalL} ${theme.spacingHorizontalL}` } : {}),
        } as React.CSSProperties
      }
    >
      <PreviewErrorBoundary name={name}>
        <div data-fluent-preview="">
          <FluentProvider theme={theme} dir={dir}>
            {content}
          </FluentProvider>
        </div>
      </PreviewErrorBoundary>
    </div>
  );
};
