import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'blume';
import type { ComponentMarkdown } from 'blume';
import { fluentIntegration } from './integration';

const base = (process.env.DOCSITE_BASE_PATH ?? '/').replace(/\/$/, '');

// Generated story islands render nothing in agent-facing Markdown: the page already carries each
// example's heading, description and source code as plain Markdown.
const islandsFile = new URL('./generated/islands.json', import.meta.url);
const islands: string[] = existsSync(islandsFile) ? JSON.parse(readFileSync(islandsFile, 'utf8')) : [];
const redirectsFile = new URL('./generated/redirects.json', import.meta.url);
const redirects: Array<{ from: string; to: string }> = existsSync(redirectsFile)
  ? JSON.parse(readFileSync(redirectsFile, 'utf8'))
  : [];
const silent: ComponentMarkdown = () => '';
const storybookEmbed: ComponentMarkdown = ({ props }) => `[${String(props.title ?? 'Open story')}](${String(props.src ?? '')})`;

export default defineConfig({
  title: 'Fluent UI',
  logo: '/fui-logo.svg',
  description: 'Fluent UI React v9, Headless and Contrib documentation.',
  content: { root: 'content' },
  basePath: '/docs',
  react: { compiler: false },
  deployment: base ? { base } : {},
  navigation: {
    tabs: [
      { label: 'React v9', path: '/react' },
      { label: 'Headless', path: '/headless' },
      { label: 'Contrib', path: '/contrib' },
    ],
  },
  github: { owner: 'microsoft', repo: 'fluentui', dir: 'apps/public-docsite-v9-blume' },
  redirects,
  seo: { og: { enabled: false } },
  feedback: false,
  agents: {
    markdownComponents: {
      ...Object.fromEntries(islands.map(name => [name, silent])),
      // eslint-disable-next-line @typescript-eslint/naming-convention -- MDX component names.
      ExampleStyles: silent,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- MDX component names.
      StorybookEmbed: storybookEmbed,
    },
  },
  integrations: [fluentIntegration()],
});
