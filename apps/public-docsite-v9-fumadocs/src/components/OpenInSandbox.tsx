import {
  getDependencies,
  openCodeSandbox,
  openStackblitz,
  scaffold,
  type Data,
} from '@fluentui/react-storybook-addon-export-to-sandbox';
import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { DocsButton } from './DocsControls';

/**
 * Mirrors the workbench's `exportToSandbox` configuration in `.storybook/preview.js`,
 * so an exported project is identical whichever host produced it.
 */
const SANDBOX_CONFIG = {
  provider: 'stackblitz-cloud',
  bundler: 'vite',
  requiredDependencies: {
    react: '^19',
    'react-dom': '^19',
    '@fluentui/react-components': '^9.0.0',
  },
  optionalDependencies: {
    '@fluentui/react-icons': 'latest',
  },
  devDependencies: {},
} satisfies Pick<Data, 'provider' | 'bundler' | 'requiredDependencies' | 'optionalDependencies' | 'devDependencies'>;

export interface OpenInSandboxProps {
  /** Story export carrying the build-injected source. */
  story: { parameters?: { fullSource?: string; cssModuleSources?: Data['cssModuleSources'] } };
  /** Name of the story's exported binding, known statically by the page. */
  exportToken: string;
  /** Human-readable label used as the sandbox description. */
  description: string;
}

/**
 * Opens the example in an online sandbox (design D5).
 *
 * Uses the addon's host-agnostic API: no Storybook runtime, no workbench DOM. The
 * document is supplied explicitly rather than taken from a global (repo rule #3).
 */
export const OpenInSandbox = ({ story, exportToken, description }: OpenInSandboxProps) => {
  const [error, setError] = React.useState<string | null>(null);

  const storyFile = story.parameters?.fullSource;
  const cssModuleSources = story.parameters?.cssModuleSources;

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!storyFile) {
        return;
      }
      const targetDocument = event.currentTarget.ownerDocument;

      try {
        setError(null);

        const data: Data = {
          ...SANDBOX_CONFIG,
          storyFile,
          storyExportToken: exportToken,
          title: 'FluentUI React v9',
          description,
          dependencies: getDependencies(
            storyFile,
            SANDBOX_CONFIG.requiredDependencies,
            SANDBOX_CONFIG.optionalDependencies,
          ),
          cssModuleSources,
        };

        const files = scaffold[data.bundler](data);
        const open = data.provider === 'stackblitz-cloud' ? openStackblitz : openCodeSandbox;

        open({ ...data, files, targetDocument });
      } catch (cause) {
        // Surface the failure rather than leaving the reader with a dead button.
        setError(cause instanceof Error ? cause.message : 'Could not open the sandbox.');
      }
    },
    [storyFile, exportToken, description, cssModuleSources],
  );

  if (!storyFile) {
    return null;
  }

  return (
    <>
      <DocsButton
        onClick={handleClick}
        iconPosition="after"
        icon={{
          className: 'inline-flex shrink-0',
          children: <ExternalLink aria-hidden="true" className="size-[var(--docs-indicator)]" />,
        }}
      >
        Open in CodeSandbox
      </DocsButton>
      {error ? (
        <p role="alert" className="order-2 min-w-0 basis-full mt-2 text-sm text-fd-destructive">
          {error}
        </p>
      ) : null}
    </>
  );
};
