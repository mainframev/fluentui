/**
 * Emits `content/contrib/**` from the fluentui-contrib docs manifest (schemaVersion 1).
 * Each manifest entry becomes one MDX page; stories embed the external Storybook through the
 * `StorybookEmbed` island, and `meta.ts` files mirror the manifest's `titlePath` ordering.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import matter from 'gray-matter';

interface ManifestProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

interface ManifestStory {
  id: string;
  name: string;
  description?: string;
  source?: string;
  embedUrl: string;
}

interface ManifestEntry {
  id: string;
  slug: string;
  titlePath: string[];
  kind: 'component' | 'page';
  description?: string;
  props?: Array<{ component: string; props: ManifestProp[] }>;
  stories: ManifestStory[];
  docsUrl: string;
  llmsUrl?: string;
  sourcePath?: string;
}

interface Manifest {
  schemaVersion: number;
  site: { id: string; title: string; baseUrl: string; sourceUrl?: string; generatedAt: string };
  entries: ManifestEntry[];
}

/** Escape MDX expression braces in prose, leaving code spans and fences alone. */
export function proseToMdx(markdown: string): string {
  return markdown
    .split(/(^```[^\n]*\n[\s\S]*?^```[^\n]*$)/gm)
    .map((part, index) =>
      index % 2
        ? part
        : part
            .split(/(`[^`\n]*`)/)
            .map((piece, i) =>
              i % 2
                ? piece
                : piece
                    .replace(/[{}]/g, match => `\\${match}`)
                    .replace(/<br\s*>/g, '<br />')
                    .replace(/<!--([\s\S]*?)-->/g, (_, comment) => `{/*${comment.replaceAll('*/', '* /')}*/}`),
            )
            .join(''),
    )
    .join('');
}

function stripLeadingHeading(markdown: string): { heading?: string; body: string } {
  const match = markdown.match(/^\s*#\s+([^\n]+)\n?/);
  return match ? { heading: match[1].trim(), body: markdown.slice(match[0].length) } : { body: markdown };
}

function firstParagraph(markdown: string): string | undefined {
  const paragraph = markdown
    .split(/\n\s*\n/)
    .map(part => part.trim())
    .find(part => part && !part.startsWith('#') && !part.startsWith('```') && !part.startsWith('<'));
  if (!paragraph) {
    return undefined;
  }
  const text = paragraph.replace(/\s+/g, ' ').replace(/[*_`]/g, '');
  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}...` : text;
}

const humanize = (slug: string) => slug.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

export async function generateContrib(options: { manifest: string; outDir: string }): Promise<{ routes: string[] }> {
  const manifest = JSON.parse(await readFile(options.manifest, 'utf8')) as Manifest;
  if (manifest.schemaVersion !== 1) {
    throw new Error(`Unsupported contrib manifest schemaVersion ${manifest.schemaVersion}`);
  }
  await rm(options.outDir, { recursive: true, force: true });
  await mkdir(options.outDir, { recursive: true });
  const storybook = manifest.site.baseUrl.replace(/\/$/, '');
  const slugs = new Set(manifest.entries.map(entry => entry.slug));
  const isFolder = (slug: string) => [...slugs].some(other => other.startsWith(`${slug}/`));
  const routes: string[] = [];
  const folders = new Map<string, { title: string; pages: string[] }>();

  const write = async (file: string, text: string) => {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, text);
  };

  const welcome = manifest.entries.find(entry => entry.kind === 'page' && entry.titlePath.length === 1);
  if (!welcome) {
    throw new Error('Contrib manifest has no top-level page entry to use as the section index');
  }

  for (const entry of manifest.entries) {
    const { heading, body } = stripLeadingHeading(entry.description ?? '');
    const title = entry === welcome ? manifest.site.title : entry.titlePath.at(-1) ?? heading ?? humanize(entry.slug);
    const sections: string[] = [];
    if (body.trim()) {
      // Relative images live in the contrib repository, not in this site: link to them on GitHub.
      const sourceDir = entry.sourcePath ? entry.sourcePath.replace(/^\.\//, '').replace(/\/[^/]*$/, '') : '';
      const prose = body
        .trim()
        .replace(/!\[([^\]]*)\]\((?!https?:|\/)([^)]+)\)/g, (_, alt, path) =>
          manifest.site.sourceUrl
            ? `[${alt || path} (image)](${manifest.site.sourceUrl}/blob/main/${sourceDir ? `${sourceDir}/` : ''}${path})`
            : `${alt || path} (image)`,
        );
      sections.push(proseToMdx(prose));
    }
    if (entry.kind === 'component') {
      if (entry.props?.length) {
        for (const group of entry.props) {
          const type = Object.fromEntries(
            group.props.map(prop => [
              prop.name,
              {
                type: prop.type,
                ...(prop.description ? { description: prop.description } : {}),
                ...(prop.required ? { required: true } : {}),
                ...(prop.defaultValue !== undefined ? { default: String(prop.defaultValue) } : {}),
              },
            ]),
          );
          sections.push(`## ${group.component} props [#props-${group.component.toLowerCase()}]\n\n<TypeTable type={${JSON.stringify(type)}} />`);
        }
      } else {
        sections.push(':::note[No API data published]\nThis package does not publish prop tables in its Storybook docs manifest.\n:::');
      }
    }
    for (const story of entry.stories) {
      sections.push(`## ${story.name} [#${story.name.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}]`);
      if (story.description) {
        sections.push(proseToMdx(story.description));
      }
      sections.push(`<StorybookEmbed src=${JSON.stringify(story.embedUrl)} title=${JSON.stringify(`${title} – ${story.name}`)} />`);
      if (story.source) {
        sections.push(`<Expandable title="Show code">\n\n\`\`\`tsx\n${story.source.replace(/\n+$/, '')}\n\`\`\`\n\n</Expandable>`);
      }
      sections.push(`[Open in Storybook](${storybook}/?path=/story/${story.id})`);
    }
    sections.push(
      `---\n\nSource: [${manifest.site.title}](${entry.docsUrl})${
        entry.sourcePath && manifest.site.sourceUrl ? ` · [${entry.sourcePath.replace(/^\.\//, '')}](${manifest.site.sourceUrl}/blob/main/${entry.sourcePath.replace(/^\.\//, '')})` : ''
      }`,
    );
    const data: Record<string, unknown> = { title };
    const description = firstParagraph(body);
    if (description) {
      data.description = description;
    }
    const file = entry === welcome ? 'index.mdx' : isFolder(entry.slug) ? `${entry.slug}/index.mdx` : `${entry.slug}.mdx`;
    await write(join(options.outDir, file), matter.stringify(`\n${sections.join('\n\n')}\n`, data));
    routes.push(entry === welcome ? 'contrib' : `contrib/${entry.slug}`);

    // Folder ordering mirrors titlePath.
    const segments = entry.slug.split('/');
    for (let depth = 1; depth < segments.length; depth++) {
      const folder = segments.slice(0, depth).join('/');
      const record = folders.get(folder) ?? { title: entry.titlePath[depth - 1] ?? humanize(segments[depth - 1]), pages: [] };
      const child = segments[depth];
      if (!record.pages.includes(child)) {
        record.pages.push(child);
      }
      folders.set(folder, record);
    }
  }

  await write(
    join(options.outDir, 'meta.ts'),
    `import { defineMeta } from 'blume';\n\nexport default defineMeta(${JSON.stringify(
      { pages: [...new Set(manifest.entries.filter(entry => entry !== welcome).map(entry => entry.slug.split('/')[0]))] },
      null,
      2,
    )});\n`,
  );
  for (const [folder, record] of folders) {
    await write(
      join(options.outDir, folder, 'meta.ts'),
      `import { defineMeta } from 'blume';\n\nexport default defineMeta(${JSON.stringify(record, null, 2)});\n`,
    );
  }
  return { routes };
}
