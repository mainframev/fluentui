'use client';

import * as React from 'react';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { webLightTheme } from '@fluentui/react-theme';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

import { sources, type DocsTree } from '../source';
import { createDocsTree } from '../utils/createDocsTree';
import { getOverviewLinks } from '../utils/getOverviewLinks';

const overviewTokens = {
  '--overview-gap': webLightTheme.spacingHorizontalL,
  '--overview-padding': webLightTheme.spacingHorizontalXXL,
  '--overview-compact-padding': webLightTheme.spacingHorizontalL,
  '--overview-title-size': webLightTheme.fontSizeBase500,
  '--overview-title-line': webLightTheme.lineHeightBase500,
  '--overview-body-size': webLightTheme.fontSizeBase300,
  '--overview-body-line': webLightTheme.lineHeightBase300,
  '--overview-weight': webLightTheme.fontWeightSemibold,
  '--overview-radius': webLightTheme.borderRadiusLarge,
  '--overview-stroke': webLightTheme.strokeWidthThin,
  '--overview-focus': webLightTheme.strokeWidthThick,
  '--overview-icon': webLightTheme.fontSizeBase500,
  '--overview-duration': webLightTheme.durationFast,
  '--overview-easing': webLightTheme.curveEasyEase,
} as React.CSSProperties;

/** Shared presentation for section navigation and alphabetical component catalogs. */
export const SectionOverview: ForwardRefComponent<{ tree: DocsTree; path: string; catalog?: boolean }> =
  React.forwardRef(({ tree, path, catalog = false }, ref) => {
    const source = sources[tree];
    const id = React.useId();
    const pages = getOverviewLinks(createDocsTree(source.pageTree), `/${tree}/${path}`, source.getPages(), catalog);
    const descriptions = new Map(source.getPages().map(page => [page.url, page.data.description]));
    const card = `grid grid-cols-[minmax(0,1fr)_auto] content-start items-start gap-[var(--overview-gap)] w-full border-[length:var(--overview-stroke)] border-fd-border rounded-[var(--overview-radius)] bg-fd-card text-fd-foreground no-underline transition-[background-color,border-color] duration-[var(--overview-duration)] ease-[var(--overview-easing)] hover:bg-fd-accent hover:border-fd-muted-foreground focus-visible:outline focus-visible:outline-[length:var(--overview-focus)] focus-visible:outline-fd-ring focus-visible:outline-offset-[var(--overview-focus)] active:bg-fd-secondary motion-reduce:transition-none ${
      catalog ? 'p-[var(--overview-compact-padding)]' : 'p-[var(--overview-padding)]'
    }`;

    return (
      <ul
        ref={ref}
        data-section-overview=""
        className="not-prose grid grid-cols-2 max-[640px]:grid-cols-1 gap-[var(--overview-gap)] p-0 list-none"
        style={overviewTokens}
      >
        {pages.map((page, index) => {
          const description = descriptions.get(page.url);
          const titleId = `${id}-${index}-title`;
          const descriptionId = description ? `${id}-${index}-description` : undefined;
          const content = (
            <>
              <span
                id={titleId}
                className={`font-[number:var(--overview-weight)] text-balance wrap-anywhere ${
                  catalog
                    ? 'text-[length:var(--overview-body-size)] leading-[var(--overview-body-line)]'
                    : 'text-[length:var(--overview-title-size)] leading-[var(--overview-title-line)]'
                }`}
              >
                {page.name}
              </span>
              <ArrowUpRight aria-hidden="true" className="size-[var(--overview-icon)] text-fd-muted-foreground" />
              {description ? (
                <span
                  id={descriptionId}
                  className="col-span-full text-fd-muted-foreground text-[length:var(--overview-body-size)] leading-[var(--overview-body-line)]"
                >
                  {description}
                </span>
              ) : null}
            </>
          );
          return (
            <li key={page.url} className="flex min-w-0">
              {page.external ? (
                <a href={page.url} className={card} aria-labelledby={titleId} aria-describedby={descriptionId}>
                  {content}
                </a>
              ) : (
                <Link to={page.url} className={card} aria-labelledby={titleId} aria-describedby={descriptionId}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    );
  });

SectionOverview.displayName = 'SectionOverview';
