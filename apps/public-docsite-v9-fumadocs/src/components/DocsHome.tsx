'use client';

import * as React from 'react';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { webLightTheme } from '@fluentui/react-theme';
import { version } from '@fluentui/react-components/package.json';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { DocsBody } from 'fumadocs-ui/page';
import reactHero from '../../../public-docsite-v9/public/fluentui-wide-banner.webp';
import headlessHero from '../../../public-docsite-v9-headless/src/assets/images/hero.svg';
import { docsControlTokens } from './DocsControls';
import { palette } from './DocsControls/styles';

const homeAction =
  'inline-flex items-center justify-center gap-[var(--home-small)] py-[var(--home-small)] text-[length:var(--home-body)] leading-[var(--home-body-line)] font-[number:var(--home-weight)] no-underline rounded-docs hover:underline underline-offset-[var(--docs-inset)] focus-visible:outline focus-visible:outline-[length:var(--docs-focus)] focus-visible:outline-docs-fg focus-visible:outline-offset-[var(--docs-focus)] [&_svg]:size-[var(--home-body)] [&_svg]:shrink-0';

const homeTokens = {
  ...docsControlTokens,
  '--home-gap': webLightTheme.spacingHorizontalXXL,
  '--home-section': webLightTheme.spacingVerticalXXXL,
  '--home-padding': webLightTheme.spacingHorizontalXL,
  '--home-small': webLightTheme.spacingVerticalM,
  '--home-title': webLightTheme.fontSizeHero900,
  '--home-title-line': webLightTheme.lineHeightHero900,
  '--home-title-mobile': webLightTheme.fontSizeHero800,
  '--home-title-mobile-line': webLightTheme.lineHeightHero800,
  '--home-title-weight': webLightTheme.fontWeightBold,
  '--home-heading': webLightTheme.fontSizeBase600,
  '--home-heading-line': webLightTheme.lineHeightBase600,
  '--home-lead': webLightTheme.fontSizeBase500,
  '--home-lead-line': webLightTheme.lineHeightBase500,
  '--home-body': webLightTheme.fontSizeBase400,
  '--home-body-line': webLightTheme.lineHeightBase400,
  '--home-weight': webLightTheme.fontWeightSemibold,
  '--home-radius': webLightTheme.borderRadiusLarge,
  '--home-stroke': webLightTheme.strokeWidthThin,
} as React.CSSProperties;

export const DocsHome: ForwardRefComponent<{
  title: string;
  description?: string;
  tree: 'react' | 'headless';
  children: React.ReactNode;
}> = React.forwardRef(({ title, description, tree, children }, ref) => (
  <article
    ref={ref}
    className={`${palette} w-full max-w-[1040px] min-w-0 mx-auto py-[var(--home-section)] px-[var(--home-padding)]`}
    style={homeTokens}
    data-docs-home={tree}
  >
    <header className="grid grid-cols-1 items-start gap-[var(--home-small)] mb-[var(--home-section)]">
      <h1 className="m-0 text-[length:var(--home-title)] leading-[var(--home-title-line)] font-[number:var(--home-title-weight)] text-balance max-[800px]:max-w-[18ch] max-[800px]:text-[length:var(--home-title-mobile)] max-[800px]:leading-[var(--home-title-mobile-line)]">
        {title}
      </h1>
      {tree === 'react' ? (
        <p className="m-0 text-docs-muted text-[length:var(--home-lead)] leading-[var(--home-lead-line)] font-[number:var(--home-weight)]">
          v{version}
        </p>
      ) : null}
      <p className="mt-[var(--home-small)] mb-0 mx-0 text-docs-muted text-[length:var(--home-lead)] leading-[var(--home-lead-line)] max-w-[65ch] text-pretty">
        {description}
      </p>
    </header>
    <img
      className="block w-full h-auto rounded-[var(--home-radius)] mx-auto mb-[var(--home-small)]"
      src={tree === 'react' ? reactHero : headlessHero}
      alt={tree === 'react' ? 'An image of many user interface component designs.' : 'Fluent headless hero'}
      width={960}
      height={400}
      fetchPriority="high"
    />
    <nav
      className={`flex flex-wrap items-center gap-y-[var(--home-small)] gap-x-[var(--home-gap)] mb-[calc(var(--home-section)*2)] ${
        tree === 'react'
          ? 'relative mt-[calc(var(--home-section)*-3)] max-[1040px]:mt-[calc(var(--home-section)*-1)] max-[800px]:mt-[calc(var(--home-small)*-1)]'
          : ''
      }`}
      aria-label={`${title} resources`}
    >
      <Link
        to={`/${tree}/getting-started`}
        className={`${homeAction} px-[var(--home-padding)] border-[length:var(--home-stroke)] border-docs-fg bg-docs-fg text-docs-bg`}
      >
        Get started <ArrowRight aria-hidden="true" />
      </Link>
      <Link to={`/${tree}/components`} className={`${homeAction} text-docs-fg`}>
        Browse components <ArrowRight aria-hidden="true" />
      </Link>
    </nav>
    <DocsBody className="min-w-0 [&>h2]:text-[length:var(--home-heading)] [&>h2]:leading-[var(--home-heading-line)] [&>h2]:font-[number:var(--home-weight)] [&>h2]:mt-[calc(var(--home-section)*2)] [&>h2]:mb-[var(--home-gap)] [&>h2]:text-balance [&>div>h2]:text-[length:var(--home-heading)] [&>div>h2]:leading-[var(--home-heading-line)] [&>div>h2]:font-[number:var(--home-weight)] [&>div>h2]:mt-[calc(var(--home-section)*2)] [&>div>h2]:mb-[var(--home-gap)] [&>div>h2]:text-balance [&>h2:first-child]:mt-0 [&>p]:max-w-[72ch] [&>ul]:max-w-[72ch] [&>div>p]:max-w-[72ch] [&>div>ul]:max-w-[72ch] max-[800px]:[&>h2]:text-[length:var(--home-lead)] max-[800px]:[&>h2]:leading-[var(--home-lead-line)] max-[800px]:[&>div>h2]:text-[length:var(--home-lead)] max-[800px]:[&>div>h2]:leading-[var(--home-lead-line)]">
      {children}
    </DocsBody>
  </article>
));
DocsHome.displayName = 'DocsHome';

export const HomeFeatures: ForwardRefComponent<{ children: React.ReactNode; compact?: boolean }> = React.forwardRef(
  ({ children, compact = false }, ref) => (
    <div
      ref={ref}
      className={`not-prose grid gap-[var(--home-section)] max-[800px]:grid-cols-1 max-[800px]:gap-[var(--home-gap)] ${
        compact
          ? 'grid-cols-2 my-[var(--home-section)] [&>div]:grid [&>div]:grid-cols-[1fr_3fr] [&>div]:items-start [&>div]:gap-[var(--home-padding)] [&>div]:pt-[var(--home-gap)]'
          : 'grid-cols-3 mt-[var(--home-gap)] mb-[var(--home-section)] max-[800px]:[&>div]:grid max-[800px]:[&>div]:grid-cols-[1fr_2fr] max-[800px]:[&>div]:items-center max-[800px]:[&>div]:gap-[var(--home-padding)] max-[800px]:[&>div>img]:m-0'
      }`}
    >
      {children}
    </div>
  ),
);
HomeFeatures.displayName = 'HomeFeatures';

export const HomeFeature: ForwardRefComponent<{
  src: string;
  alt: string;
  title?: string;
  children: React.ReactNode;
}> = React.forwardRef(({ src, alt, title, children }, ref) => (
  <div ref={ref} className="min-w-0">
    <img
      className="block w-full max-w-[240px] h-auto rounded-[var(--home-radius)] mb-[var(--home-padding)]"
      src={src}
      alt={alt}
      loading="lazy"
      width={240}
      height={160}
    />
    <div>
      {title ? (
        <h3 className="text-[length:var(--home-lead)] leading-[var(--home-lead-line)] font-[number:var(--home-weight)] mt-0 mb-[var(--home-small)] text-balance">
          {title}
        </h3>
      ) : null}
      <p className="m-0 text-docs-muted text-[length:var(--home-body)] leading-[var(--home-body-line)] text-pretty">
        {children}
      </p>
    </div>
  </div>
));
HomeFeature.displayName = 'HomeFeature';
