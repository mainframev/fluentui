'use client';

import * as React from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { webLightTheme } from '@fluentui/react-theme';
import { DocsButton, docsControlTokens } from './DocsControls';
import { MarkdownActions } from './MarkdownActions';

import { DocsSettingsProvider, THEMES, isThemeId } from './DocsSettings';
import { Description } from './Markdown';
import { OpenInSandbox } from './OpenInSandbox';
import { StoryPreview, PreviewSettingsProvider, usePreviewSettings } from './StoryPreview';
import { StandaloneExampleContext } from './useStandaloneExample';
import { StorySource } from './StorySource';
import { toKebabCase } from '../utils/toKebabCase';
import { docsBasename } from '../utils/paths';
import { ComponentPageHeaderContext } from './ComponentPageHeaderContext';
import { palette } from './DocsControls/styles';

const sectionHeading =
  '[&>h2]:mt-0 [&>h2]:mb-[var(--component-heading-gap)] [&>h2]:text-[length:var(--component-heading-size)] [&>h2]:leading-[var(--component-heading-line)] [&>h2]:font-[number:var(--component-title-weight)]';

const componentPageTokens = {
  ...docsControlTokens,
  '--component-title-size': webLightTheme.fontSizeHero900,
  '--component-title-line': webLightTheme.lineHeightHero900,
  '--component-mobile-title-size': webLightTheme.fontSizeHero800,
  '--component-mobile-title-line': webLightTheme.lineHeightHero800,
  '--component-title-weight': webLightTheme.fontWeightSemibold,
  '--component-title-gap': webLightTheme.spacingVerticalXL,
  '--component-lead-size': webLightTheme.fontSizeBase500,
  '--component-lead-line': webLightTheme.lineHeightBase500,
  '--component-heading-size': webLightTheme.fontSizeBase600,
  '--component-heading-line': webLightTheme.lineHeightBase600,
  '--component-heading-gap': webLightTheme.spacingVerticalXL,
  '--component-section-gap': webLightTheme.spacingVerticalXXXL,
  '--component-preview-padding': webLightTheme.spacingHorizontalXXXL,
  '--component-control-padding': webLightTheme.spacingHorizontalL,
  '--component-stroke': webLightTheme.strokeWidthThin,
  '--component-radius': webLightTheme.borderRadiusLarge,
} as React.CSSProperties;

/**
 * Matches the anchor scheme used by the Storybook docs page, so deep links stay stable.
 *
 * Storybook derives a story's id by hyphenating the export name (`MotionCustom` becomes
 * `motion-custom`), which is the form the migrated links use. Lowercasing alone produced
 * `motioncustom`, so every deep link to an example landed at the top of the page instead.
 */
export function nameToHash(name: string): string {
  return toKebabCase(name);
}

type Story = React.ComponentType<Record<string, unknown>> & {
  parameters?: { docs?: { description?: { story?: string } }; fullSource?: string };
  args?: Record<string, unknown>;
};

interface Meta {
  title?: string;
  decorators?: import('./StoryPreview').StoryDecorator[];
  parameters?: {
    docs?: { description?: { component?: string }; hideArgsTable?: boolean };
  };
}

export interface ComponentPageProps {
  meta: Meta;
  /** The story module namespace (`import * as stories from '...'`). */
  stories: Record<string, unknown>;
  /** Component whose exported Props type is resolved at MDX build time. */
  docgen?: string;
  /** API tables injected by the build-time MDX integration. */
  children?: React.ReactNode;
  /**
   * Explicit example order.
   *
   * ES module namespace objects sort their keys alphabetically, so the order authored in
   * `index.stories.tsx` is not recoverable from the import alone. Pass this to restore it.
   */
  order?: string[];
  /** Replaces a story file's Storybook `decorators`. */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Omit the theme picker for trees where theming does not apply (e.g. headless). */
  showThemePicker?: boolean;
}

function isStory(value: unknown): value is Story {
  return typeof value === 'function';
}

function collectStories(stories: Record<string, unknown>, order?: string[]): Array<[string, Story]> {
  const entries = Object.entries(stories).filter(
    (entry): entry is [string, Story] => entry[0] !== 'default' && isStory(entry[1]),
  );

  if (!order) {
    return entries;
  }

  const byName = new Map(entries);
  const ordered = order.flatMap(name => {
    const story = byName.get(name);
    byName.delete(name);
    return story ? ([[name, story]] as Array<[string, Story]>) : [];
  });

  // Anything not named in `order` still renders, after the ordered examples.
  return [...ordered, ...byName.entries()];
}

const Example = ({
  name,
  story,
  docgenTitle,
  wrapper,
  decorators,
  primary = false,
}: {
  name: string;
  story: Story;
  docgenTitle: string;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  decorators?: import('./StoryPreview').StoryDecorator[];
  primary?: boolean;
}) => {
  const description = story.parameters?.docs?.description?.story;
  const { pathname } = useLocation();
  const { themeId, dir } = usePreviewSettings();
  const exampleUrl = `${docsBasename}${pathname}?${new URLSearchParams({ example: name, theme: themeId, dir })}`;

  return (
    <section className={`my-[var(--component-section-gap)] min-w-0 ${sectionHeading}`}>
      <h2 id={nameToHash(name)}>{name}</h2>
      {description ? <Description>{description}</Description> : null}
      <div className="mt-[var(--component-heading-gap)] border-[length:var(--component-stroke)] border-docs-border rounded-[var(--component-radius)] min-w-0">
        <StoryPreview
          story={story}
          name={name}
          wrapper={wrapper}
          decorators={decorators}
          args={story.args}
          className={`rounded-t-[var(--component-radius)] p-[var(--component-preview-padding)] max-[640px]:p-[var(--component-control-padding)] ${
            primary ? 'min-h-[calc(var(--component-section-gap)*4)] grid items-center' : ''
          }`}
        />
        <div
          className="not-prose flex flex-wrap items-center justify-end max-[640px]:justify-start gap-docs-gap p-[var(--component-control-padding)] border-t-[length:var(--component-stroke)] border-docs-border rounded-b-[var(--component-radius)] bg-docs-bg"
          style={docsControlTokens}
        >
          <StorySource story={story} />
          <DocsButton
            as="a"
            href={exampleUrl}
            className="no-underline"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${name} in a new tab`}
            iconPosition="after"
            icon={{
              className: 'inline-flex items-center shrink-0',
              children: <ExternalLink aria-hidden="true" className="size-[var(--docs-indicator)]" />,
            }}
          >
            Open in a new tab
          </DocsButton>
          <OpenInSandbox story={story} exportToken={name} description={`${docgenTitle} - ${name}`} />
        </div>
      </div>
    </section>
  );
};

/**
 * Renders a complete component page from its story module (design D4).
 *
 * Section order: settings → introduction → primary example →
 * API → remaining examples. Sections with no content are omitted rather than left empty.
 */
export const ComponentPage = ({
  meta,
  stories,
  docgen,
  order,
  wrapper,
  showThemePicker,
  children,
}: ComponentPageProps): React.ReactElement => {
  // The build records the authored export order (see vite-plugins/story-order.ts), because a
  // module namespace object would otherwise hand us the examples alphabetically.
  const authored = Array.isArray(stories.__storyOrder) ? (stories.__storyOrder as string[]) : undefined;
  const entries = collectStories(stories, order ?? authored);
  const [primary, ...rest] = entries;
  const showArgsTable = docgen && meta.parameters?.docs?.hideArgsTable !== true;
  const title = meta.title ?? docgen ?? 'Component';
  const example = React.useContext(StandaloneExampleContext);
  const header = React.useContext(ComponentPageHeaderContext);
  const description = meta.parameters?.docs?.description?.component || header?.description;
  const [params] = useSearchParams();

  if (example !== undefined) {
    const selected = entries.find(([name]) => name === example);
    if (!selected) {
      return <p role="alert">Example “{example}” was not found.</p>;
    }
    const requestedTheme = params.get('theme');
    const themeId = isThemeId(requestedTheme) ? requestedTheme : 'web-light';
    return (
      <PreviewSettingsProvider
        value={{ theme: THEMES[themeId].theme, themeId, dir: params.get('dir') === 'rtl' ? 'rtl' : 'ltr' }}
      >
        <StoryPreview
          story={selected[1]}
          name={selected[0]}
          wrapper={wrapper}
          decorators={meta.decorators}
          args={selected[1].args}
          standalone
        />
      </PreviewSettingsProvider>
    );
  }

  return (
    <div className={`${palette} min-w-0`} style={componentPageTokens} data-component-page="">
      <DocsSettingsProvider
        showThemePicker={showThemePicker}
        actions={<MarkdownActions key={title} />}
        className="mt-docs-indicator mb-[var(--component-section-gap)] py-[var(--component-control-padding)]"
        introduction={
          <div className="mb-[var(--component-section-gap)] [&_h1]:m-0 [&_h1]:text-[length:var(--component-title-size)] [&_h1]:leading-[var(--component-title-line)] [&_h1]:font-[number:var(--component-title-weight)] [&_h1]:text-balance max-[640px]:[&_h1]:text-[length:var(--component-mobile-title-size)] max-[640px]:[&_h1]:leading-[var(--component-mobile-title-line)]">
            {header?.title}
            {description ? (
              <div className="mt-[var(--component-title-gap)] [&>div>p:first-child]:max-w-[65ch] [&>div>p:first-child]:mt-0 [&>div>p:first-child]:text-[length:var(--component-lead-size)] [&>div>p:first-child]:leading-[var(--component-lead-line)] [&>div>p:first-child]:text-docs-muted">
                <Description>{description}</Description>
              </div>
            ) : null}
          </div>
        }
      >
        {primary ? (
          <Example
            name={primary[0]}
            primary
            story={primary[1]}
            docgenTitle={title}
            wrapper={wrapper}
            decorators={meta.decorators}
          />
        ) : null}

        {showArgsTable ? (
          <section
            className={`my-[var(--component-section-gap)] pt-[var(--component-heading-gap)] border-t-[length:var(--component-stroke)] border-docs-border min-w-0 ${sectionHeading}`}
          >
            <h2 id="api">API</h2>
            {children}
          </section>
        ) : null}

        {rest.map(([name, story]) => (
          <Example
            key={name}
            name={name}
            story={story}
            docgenTitle={title}
            wrapper={wrapper}
            decorators={meta.decorators}
          />
        ))}
      </DocsSettingsProvider>
    </div>
  );
};
