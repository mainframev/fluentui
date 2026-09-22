import * as React from 'react';
import { CodeXml } from 'lucide-react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

import { highlightCode } from './highlighter';
import { DocsButton, docsControlTokens } from './DocsControls';
import { palette } from './DocsControls/styles';

export interface StorySourceProps {
  /** Story export carrying the build-injected standalone source. */
  story: { parameters?: { fullSource?: string } };
  /** Whether the panel starts expanded. */
  defaultOpen?: boolean;
}

/**
 * Reveals the standalone source the build injected onto the story (design D2), with
 * syntax highlighting and copy-to-clipboard.
 */
export const StorySource = ({ story, defaultOpen = false }: StorySourceProps) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const source = story.parameters?.fullSource;

  const html = React.useMemo(() => (source ? highlightCode(source) : ''), [source]);
  const toggleOpen = React.useCallback(() => setOpen(value => !value), []);

  if (!source) {
    return null;
  }

  return (
    <>
      <DocsButton
        onClick={toggleOpen}
        aria-expanded={open}
        iconPosition="after"
        icon={{
          className: 'inline-flex shrink-0',
          children: <CodeXml aria-hidden="true" className="size-[var(--docs-indicator)]" />,
        }}
      >
        {open ? 'Hide code' : 'Show code'}
      </DocsButton>
      {open ? (
        <CodeBlock
          className={`${palette} order-2 min-w-0 basis-full bg-[var(--docs-bg)]`}
          style={docsControlTokens}
          viewportProps={{ 'aria-label': 'Example source code' }}
        >
          {/* Shiki escapes the build-injected story source before producing this HTML. */}
          <Pre dangerouslySetInnerHTML={{ __html: html }} />
        </CodeBlock>
      ) : null}
    </>
  );
};
