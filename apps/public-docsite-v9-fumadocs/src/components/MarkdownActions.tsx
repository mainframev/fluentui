import * as React from 'react';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { Check, ChevronDown } from 'lucide-react';
import { MarkdownRegular } from '@fluentui/react-icons';
import { webLightTheme } from '@fluentui/react-theme';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItemLink,
} from '@fluentui/react-headless-components-preview/menu';
import { useLocation } from 'react-router';
import { docsBasename } from '../utils/paths';

import { DocsButton, docsControlTokens } from './DocsControls';
import { palette } from './DocsControls/styles';

const actionIcon =
  'inline-flex items-center justify-center size-docs-indicator shrink-0 leading-none [&>svg]:block [&>svg]:size-full';

export const MarkdownActions: ForwardRefComponent<React.ComponentProps<'div'>> = React.forwardRef((props, ref) => {
  const { pathname } = useLocation();
  const markdownUrl = `${docsBasename}${pathname.replace(/\/$/, '')}.txt`;
  const [status, setStatus] = React.useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const resetTimer = React.useRef<ReturnType<typeof globalThis.setTimeout> | undefined>(undefined);

  React.useEffect(() => () => globalThis.clearTimeout(resetTimer.current), []);

  const copyMarkdown = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      const targetWindow = event.currentTarget.ownerDocument.defaultView;
      const clipboard = targetWindow?.navigator.clipboard;
      globalThis.clearTimeout(resetTimer.current);
      setStatus('copying');

      try {
        if (!targetWindow || !clipboard) {
          throw new Error('Clipboard is unavailable');
        }
        const response = await targetWindow.fetch(markdownUrl);
        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('Markdown could not be loaded');
        }
        await clipboard.writeText(await response.text());
        setStatus('copied');
        resetTimer.current = globalThis.setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
      }
    },
    [markdownUrl],
  );

  return (
    <div
      {...props}
      ref={ref}
      className={`flex flex-col items-start gap-docs-gap min-w-0 ${props.className ?? ''}`}
      style={{ ...docsControlTokens, ...props.style }}
    >
      <div
        className="inline-flex items-stretch max-w-full [&>:focus-visible]:relative [&>:focus-visible]:z-10"
        role="group"
        aria-label="Page Markdown"
      >
        <DocsButton
          onClick={copyMarkdown}
          disabled={status === 'copying'}
          className="rounded-e-none"
          aria-label="Copy page content as Markdown to clipboard"
          icon={{
            className: actionIcon,
            children: status === 'copied' ? <Check aria-hidden="true" /> : <MarkdownRegular aria-hidden="true" />,
          }}
        >
          <span className="grid [&>span]:[grid-area:1/1] [&>span]:whitespace-nowrap [&>[aria-hidden=true]]:invisible">
            {['Copy Page', 'Copying…', 'Copied'].map(label => (
              <span
                key={label}
                aria-hidden={
                  label !== (status === 'copied' ? 'Copied' : status === 'copying' ? 'Copying…' : 'Copy Page')
                }
              >
                {label}
              </span>
            ))}
          </span>
        </DocsButton>
        <Menu positioning="below-end">
          <MenuTrigger disableButtonEnhancement>
            <DocsButton
              aria-label="Markdown actions"
              className="rounded-s-none border-s-0 shrink-0 no-underline w-docs-height px-0!"
              icon={{ className: actionIcon, children: <ChevronDown aria-hidden="true" /> }}
            />
          </MenuTrigger>
          <MenuPopover
            className={`${palette} p-docs-y border-solid border-docs-border rounded-docs bg-docs-bg text-docs-fg text-docs`}
            style={{
              ...docsControlTokens,
              borderWidth: webLightTheme.strokeWidthThin,
              boxShadow: webLightTheme.shadow8,
            }}
          >
            <MenuList>
              <MenuItemLink
                href={markdownUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="View as Markdown (opens in a new tab)"
                className="flex items-center gap-docs-gap py-docs-y px-docs-x min-h-docs-height rounded-docs text-inherit no-underline cursor-pointer hover:bg-docs-fg hover:text-docs-bg focus:bg-docs-fg focus:text-docs-bg"
                icon={{ className: actionIcon, children: <MarkdownRegular aria-hidden="true" /> }}
              >
                View as Markdown
              </MenuItemLink>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
      <span role="status" aria-live="polite" className={status === 'error' ? 'text-fd-destructive' : 'sr-only'}>
        {status === 'copied'
          ? 'Copied page as Markdown'
          : status === 'error'
          ? 'Could not copy. Choose View as Markdown from the menu to copy it manually.'
          : ''}
      </span>
    </div>
  );
});

MarkdownActions.displayName = 'MarkdownActions';
