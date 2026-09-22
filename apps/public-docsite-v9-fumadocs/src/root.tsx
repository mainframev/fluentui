import * as React from 'react';
import { webLightTheme } from '@fluentui/react-theme';
import { SSRProvider } from '@fluentui/react-utilities';
import { RootProvider } from 'fumadocs-ui/provider/react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { DocsSearch } from './components/DocsSearch';
import { docsControlTokens } from './components/DocsControls';
import { palette } from './components/DocsControls/styles';

import './app.css';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fluent UI React v9</title>
        <Meta />
        <Links />
      </head>
      <body
        className={`${palette} flex flex-col min-h-screen`}
        style={
          { ...docsControlTokens, '--docs-related-links-gap': webLightTheme.spacingVerticalL } as React.CSSProperties
        }
      >
        <SSRProvider>
          <RootProvider
            /*
             * The dialog fetches the prerendered native index (see src/routes/search.ts).
             */
            search={{ SearchDialog: DocsSearch }}
          >
            {children}
          </RootProvider>
        </SSRProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const Root = () => {
  return <Outlet />;
};

export default Root;
