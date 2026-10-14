/**
 * Generates the Blume project from the authored Fumadocs content.
 *
 * Authored MDX under `../content` stays untouched. For every page this script resolves the story
 * modules it imports, emits one React island per page (`islands/generated/*.tsx`) that renders a
 * story by `name`, collects the stories' Griffel rules into static CSS, and rewrites the page into
 * plain Blume MDX (`content/**`). `meta.json` becomes `meta.ts`, the contrib manifest becomes
 * `content/contrib/**`, and finally the Blume CLI runs with the requested command.
 */
import { mkdir, readFile, writeFile, rm, readdir, cp, copyFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, relative, basename, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createDOMRenderer, renderToStyleElements, RendererProvider } from '@griffel/react';
import { createLogger, createServer } from 'vite';
import matter from 'gray-matter';
import { parse } from '@babel/parser';
import { componentApiSource } from '../mdx-plugins/component-api-source';
import { toKebabCase } from '../src/utils/toKebabCase';
import { storyVite, headlessTokensCss } from './story-config';
import { createApiExtractor } from './api';
import { generateContrib } from './generate-contrib';

const root = fileURLToPath(new URL('.', import.meta.url));
const app = dirname(root);
const require = createRequire(import.meta.url);
const command = process.argv[2] ?? 'build';
const generateOnly = process.argv.includes('--generate-only');
const base = (process.env.DOCSITE_BASE_PATH ?? '/').replace(/\/$/, '');
const sourceRoot = join(app, 'content');
const started = Date.now();

interface Page {
  file: string;
  route: string;
  data: Record<string, unknown>;
  content: string;
}

interface ImportInfo {
  text: string;
  path: string;
  bindings: Array<{ local: string; imported: string }>;
}

const log = (message: string) => process.stdout.write(`[generate] ${message}\n`);

const write = async (file: string, text: string) => {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text);
};

/** Apply a transform only to prose, never to fenced code. */
function outsideCode(source: string, transform: (text: string) => string): string {
  return source
    .split(/(^```[^\n]*\n[\s\S]*?^```[^\n]*$)/gm)
    .map((part, index) => (index % 2 ? part : transform(part)))
    .join('');
}

/** The prose of a document with every fenced code block removed. */
function proseOnly(source: string): string {
  return source
    .split(/(^```[^\n]*\n[\s\S]*?^```[^\n]*$)/gm)
    .filter((_, index) => index % 2 === 0)
    .join('\n');
}

/** Escape MDX expression braces in prose that came from Storybook descriptions; close void tags. */
function proseToMdx(markdown: string): string {
  return outsideCode(markdown, text =>
    text
      .split(/(`[^`\n]*`)/)
      .map((part, index) =>
        index % 2
          ? part
          : part
              .replace(/[{}]/g, match => `\\${match}`)
              .replace(/<br\s*>/g, '<br />')
              .replace(/<!--([\s\S]*?)-->/g, (_, comment) => `{/*${comment.replaceAll('*/', '* /')}*/}`),
      )
      .join(''),
  );
}

/** Authored MDX may carry HTML comments, which MDX rejects. */
function htmlCommentsToMdx(source: string): string {
  return outsideCode(source, text => text.replace(/<!--([\s\S]*?)-->/g, (_, comment) => `{/*${comment.replaceAll('*/', '* /')}*/}`));
}

/** Story descriptions link to Storybook routes; point them at the generated docs instead. */
const storyMarkdown = (text: string) =>
  proseToMdx(
    text.replace(
      /href=(["'])\/?\?path=\/docs\/overview-browser-support--docs([^"']*)\1/g,
      `href=$1/headless/guide/browser-support$2$1`,
    ),
  );

/** Function components, plus `React.forwardRef` / `React.memo` exotic components. */
function isComponent(value: unknown): value is React.ComponentType<Record<string, unknown>> {
  return typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value);
}

function pascal(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join('');
}

function parseImports(content: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  outsideCode(content, text => {
    for (const match of text.matchAll(/^import\s+[\s\S]*?;[ \t]*$/gm)) {
      const node = parse(match[0], { sourceType: 'module', plugins: ['typescript'] }).program.body[0];
      if (node.type !== 'ImportDeclaration') {
        continue;
      }
      imports.push({
        text: match[0],
        path: node.source.value,
        bindings: node.specifiers.map(specifier => ({
          local: specifier.local.name,
          imported:
            specifier.type === 'ImportDefaultSpecifier'
              ? 'default'
              : specifier.type === 'ImportNamespaceSpecifier'
              ? '*'
              : specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value,
        })),
      });
    }
    return text;
  });
  return imports;
}

const tsconfigPaths: Record<string, string[]> = JSON.parse(readFileSync(join(app, '../../tsconfig.base.all.json'), 'utf8'))
  .compilerOptions.paths;

/**
 * Islands import story modules by absolute path. Rolldown resolves `@fluentui/<pkg>-stories/src/...`
 * through the package entry (`stories/src/index.ts/src/...`) and fails, whereas Vite's dev resolver
 * follows the workspace symlink; the absolute path works in both.
 */
function absoluteModulePath(specifier: string): string {
  if (specifier.startsWith('/')) {
    return specifier;
  }
  if (specifier.startsWith('@repo/')) {
    return join(app, '../..', specifier.slice('@repo/'.length));
  }
  const match = specifier.match(/^(@fluentui\/[^/]+)\/(.*)$/);
  const mapping = match && tsconfigPaths[match[1]]?.[0];
  if (!match || !mapping) {
    return specifier;
  }
  // Mappings point at `<package>/stories/src/index.ts`; the specifier's rest already starts with `src/`.
  const candidate = join(app, '../..', dirname(dirname(mapping)), match[2]);
  for (const file of [candidate, `${candidate}.tsx`, `${candidate}.ts`, join(candidate, 'index.tsx'), join(candidate, 'index.ts')]) {
    if (existsSync(file)) {
      return file;
    }
  }
  throw new Error(`Cannot resolve story module ${specifier} (tried ${candidate})`);
}

const files = (await readdir(sourceRoot, { recursive: true })).filter(file => file.endsWith('.mdx')).sort();
const pages: Page[] = await Promise.all(
  files.map(async file => {
    const source = await readFile(join(sourceRoot, file), 'utf8');
    const { data, content } = matter(source);
    return { file, data, content, route: file.replace(/\.mdx$/, '').replace(/\/index$/, '') };
  }),
);

// `button/button.mdx` beside `button/index.mdx` duplicates the sidebar label. The component page
// becomes the folder index (its URL loses the repeated segment, with a redirect) and Blume's
// `directory: "card"` lists the family below it in place of the hand-written overview page.
const promoted = new Map<string, string>();
const redirects: Array<{ from: string; to: string }> = [];
for (const page of pages) {
  const segments = page.route.split('/');
  const folder = segments.slice(0, -1).join('/');
  if (segments.length > 1 && segments.at(-1) === segments.at(-2) && pages.some(other => other.route === folder)) {
    promoted.set(folder, page.route);
    redirects.push({ from: `/${page.route}`, to: `/${folder}` });
  }
}
const promotedFolders = new Set(promoted.keys());
const promotedPages = new Set(promoted.values());

for (const directory of ['content', 'islands/generated', 'generated', 'public']) {
  await rm(join(root, directory), { recursive: true, force: true });
  await mkdir(join(root, directory), { recursive: true });
}
await cp(join(app, 'public'), join(root, 'public'), { recursive: true });

const logger = createLogger('warn');
const warnOnce = logger.warnOnce.bind(logger);
logger.warnOnce = (message, options) => {
  // Tabster 8.8.0 publishes maps without sourcesContent or the referenced src files.
  if (/Sourcemap for ".*\/node_modules\/tabster\/dist\/esm\/.*\.js" points to missing source files/.test(message)) {
    return;
  }
  warnOnce(message, options);
};
const vite = await createServer({
  ...storyVite(false),
  configFile: false,
  root,
  customLogger: logger,
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
});

// Unbuilt workspace packages resolve to source through Vite's aliases, not Node's resolver.
const { SSRProvider } = (await vite.ssrLoadModule('@fluentui/react-utilities')) as {
  SSRProvider: React.ComponentType<{ children?: React.ReactNode }>;
};
const extract = createApiExtractor();
const islandNames = new Set<string>();
const metadata: Record<string, { route: string; examples: number; api: number; islands: string[] }> = {};
const stats = { pages: 0, componentPages: 0, stories: 0, islands: 0, apiTables: 0, apiRows: 0, cssBytes: 0, ssrSkipped: [] as string[] };

function uniqueIsland(name: string): string {
  let candidate = name;
  for (let suffix = 2; islandNames.has(candidate); suffix++) {
    candidate = `${name}${suffix}`;
  }
  islandNames.add(candidate);
  return candidate;
}

/** Render a React element with a fresh Griffel renderer and return the collected CSS. */
function collectCss(render: (renderer: ReturnType<typeof createDOMRenderer>) => React.ReactElement): string {
  const renderer = createDOMRenderer();
  renderToStaticMarkup(React.createElement(RendererProvider, { renderer, children: render(renderer) }));
  return renderToStyleElements(renderer)
    .map(element => (element.props as React.ComponentProps<'style'>).dangerouslySetInnerHTML?.__html ?? '')
    .join('\n');
}

interface StoryModule {
  default?: { decorators?: unknown[]; parameters?: Record<string, any>; title?: string };
  __storyOrder?: string[];
  [name: string]: any;
}

interface IslandOptions {
  /** Island identifier (PascalCase). */
  name: string;
  /** Absolute or bare module specifier of the story module. */
  modulePath: string;
  /** Loaded module (for build-time rendering). */
  module: StoryModule;
  /** Export names rendered through `<Example>`; `*` members not listed render bare. */
  stories: string[];
  headless: boolean;
  /** Stories rendered bare (no Example chrome), keyed by export name. */
  bare?: string[];
  decorators?: boolean;
}

/**
 * Emit `islands/generated/<Name>.tsx` rendering `module[name]` either inside the Example chrome or
 * bare, plus `generated/<Name>.css` holding the Griffel rules of every story's default state.
 */
async function makeIsland(options: IslandOptions): Promise<{ name: string; ssrSkipped: string[]; styles: string }> {
  const { Example } = await vite.ssrLoadModule(join(root, 'Example.tsx'));
  const ssrSkipped: string[] = [];
  const css: string[] = [];
  const decorators = options.decorators ? options.module.default?.decorators : undefined;
  for (const name of [...options.stories, ...(options.bare ?? [])]) {
    const story = options.module[name];
    if (!isComponent(story)) {
      throw new Error(`${options.modulePath}: export ${name} is not a component`);
    }
    try {
      css.push(
        collectCss(renderer =>
          options.bare?.includes(name)
            ? React.createElement(SSRProvider, null, React.createElement(story))
            : React.createElement(Example, { story, name, renderer, headless: options.headless, decorators }),
        ),
      );
    } catch (error) {
      ssrSkipped.push(name);
      stats.ssrSkipped.push(`${options.name}.${name}: ${(error as Error).message.split('\n')[0]}`);
    }
  }
  const specifier = absoluteModulePath(options.modulePath);
  const island = `// Generated by blume/generate.ts — do not edit.
import * as React from 'react';
import ${options.decorators ? 'meta, ' : ''}* as stories from ${JSON.stringify(specifier)};
import { SSRProvider } from '@fluentui/react-utilities';
import { Example } from '../../Example';
${options.headless ? `import ${JSON.stringify(headlessTokensCss)};\n` : ''}
export const client = 'load';
const ssrSkipped = new Set(${JSON.stringify(ssrSkipped)});
const bare = new Set(${JSON.stringify(options.bare ?? [])});
type Props = { name: string } & Record<string, unknown>;
export default function ${options.name}({ name, ...props }: Props): React.ReactElement {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const story = (stories as Record<string, unknown>)[name] as React.ComponentType<Record<string, unknown>> | undefined;
  if (!story) {
    return <p role="alert">Unknown example: {name}</p>;
  }
  if (ssrSkipped.has(name) && !mounted) {
    return <div data-example-pending="" style={{ minHeight: 120 }} />;
  }
  if (bare.has(name)) {
    const Story = story;
    return (
      <SSRProvider>
        <Story {...props} />
      </SSRProvider>
    );
  }
  return <Example story={story} name={name} headless={${options.headless}} decorators={${
    options.decorators ? '(meta as { decorators?: never }).decorators' : 'undefined'
  }} />;
}
`;
  await write(join(root, `islands/generated/${options.name}.tsx`), island);
  stats.islands++;
  stats.cssBytes += css.join('\n').length;
  return { name: options.name, ssrSkipped, styles: `<ExampleStyles css={${JSON.stringify(css.join('\n'))}} />` };
}

const sourceBlock = (source: string, lang = 'tsx') =>
  `<Expandable title="Show code">\n\n\`\`\`${lang}\n${source.replace(/\n+$/, '')}\n\`\`\`\n\n</Expandable>`;

/** Copy an imported asset into `public/assets` and return its served URL. */
async function publishAsset(absolute: string): Promise<string> {
  const rel = relative(app, absolute).replaceAll('\\', '/').replace(/^(\.\.\/)+/, '').replace(/[^A-Za-z0-9/._-]/g, '_');
  const target = join(root, 'public/assets', rel);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(absolute, target);
  return `${base}/assets/${rel}`;
}

function childrenOf(page: Page, catalog: boolean): Page[] {
  const prefix = `${page.route}/`;
  const direct = pages.filter(child => child.route.startsWith(prefix) && child.route !== page.route);
  if (catalog) {
    return direct.filter(child => /<ComponentPage/.test(child.content));
  }
  const seen = new Set<string>();
  const result: Page[] = [];
  for (const child of direct) {
    const [segment, ...rest] = child.route.slice(prefix.length).split('/');
    if (rest.length === 0) {
      if (!seen.has(segment)) {
        seen.add(segment);
        result.push(child);
      }
      continue;
    }
    // A folder is represented by its index page, else its first page.
    if (!seen.has(segment)) {
      const folder = `${prefix}${segment}`;
      const index = pages.find(candidate => candidate.route === folder);
      seen.add(segment);
      result.push(index ?? child);
    }
  }
  return result;
}

const card = (title: string, href: string, body: string) =>
  `<Card title=${JSON.stringify(title)} href=${JSON.stringify(href)}>\n${proseToMdx(body)}\n</Card>`;

try {
  for (const page of pages) {
    if (promotedFolders.has(page.route)) {
      continue; // replaced by the promoted component page plus a directory listing
    }
    const imports = parseImports(page.content);
    const headless = page.route.startsWith('headless/');
    const collection = headless ? 'Headless' : 'React';
    const islands: string[] = [];
    let content = page.content;
    const prose = proseOnly(content);
    const componentTag = prose.match(/^<ComponentPage\s[\s\S]*?\/>/m);

    if (componentTag) {
      stats.componentPages++;
      const storyImport = imports.find(item => item.bindings.some(binding => binding.imported === '*'));
      if (!storyImport) {
        throw new Error(`Missing story namespace import in ${page.file}`);
      }
      if (/\b(order|wrapper)=/.test(componentTag[0])) {
        throw new Error(`${page.file}: ComponentPage order/wrapper props are not supported by the generator`);
      }
      const module = (await vite.ssrLoadModule(storyImport.path)) as StoryModule;
      const meta = module.default ?? {};
      const order = module.__storyOrder ?? Object.keys(module);
      const names = order.filter(name => name !== 'default' && name !== '__storyOrder' && isComponent(module[name]));
      if (!names.length) {
        throw new Error(`${page.file}: no stories found in ${storyImport.path}`);
      }
      const component = componentTag[0].match(/docgen="([^"]+)"/)?.[1];
      const api =
        component && meta.parameters?.docs?.hideArgsTable !== true
          ? extract(...(Object.values(componentApiSource(storyImport.path, component)) as [string, string]))
          : {};
      const islandName = uniqueIsland(`${collection}${pascal(component ?? basename(page.route))}Stories`);
      const { ssrSkipped, styles } = await makeIsland({
        name: islandName,
        modulePath: storyImport.path,
        module,
        stories: names,
        headless,
        decorators: Array.isArray(meta.decorators) && meta.decorators.length > 0,
      });
      islands.push(islandName);
      const description = meta.parameters?.docs?.description?.component ?? '';
      const sections: string[] = [styles];
      if (description) {
        sections.push(storyMarkdown(description));
      }
      for (const [index, name] of names.entries()) {
        const story = module[name];
        stats.stories++;
        sections.push(`## ${name} [#${toKebabCase(name)}]`);
        const storyDescription = story.parameters?.docs?.description?.story;
        if (storyDescription) {
          sections.push(storyMarkdown(storyDescription));
        }
        sections.push(`<${islandName} name=${JSON.stringify(name)} />`);
        if (story.parameters?.fullSource) {
          sections.push(sourceBlock(story.parameters.fullSource));
        }
        if (index === 0 && Object.keys(api).length) {
          stats.apiTables++;
          stats.apiRows += Object.keys(api).length;
          sections.push(`## API [#api]\n\n<TypeTable type={${JSON.stringify(api)}} />`);
        }
      }
      content = sections.join('\n\n');
      metadata[page.route] = {
        route: `/docs/${page.route}`,
        examples: names.length,
        api: Object.keys(api).length,
        islands,
      };
      if (ssrSkipped.length) {
        log(`${page.route}: client-only stories ${ssrSkipped.join(', ')}`);
      }
    } else {
      let parentPath: string | undefined;
      content = content.replace(/^export const parentPath = (['"])([^'"]+)\1;?\s*$/m, (_, __, value) => {
        parentPath = value;
        return '';
      });
      for (const item of imports) {
        if (item.path.includes('/SectionOverview')) {
          content = content.replace(item.text, '');
          content = outsideCode(content, text =>
            text.replace(/<SectionOverview\s+tree="(\w+)"\s+path="([^"]+)"(\s+catalog)?\s*\/>/g, (_, tree, path, catalog) => {
              const parent = pages.find(candidate => candidate.route === `${tree}/${path}`) ?? page;
              const children = childrenOf(parent, Boolean(catalog));
              return `<CardGroup cols={2}>\n${children
                .map(child =>
                  card(String(child.data.title ?? child.route), `/${child.route}`, String(child.data.description ?? '')),
                )
                .join('\n')}\n</CardGroup>`;
            }),
          );
          continue;
        }
        if (item.path.includes('/DocsHome')) {
          content = content.replace(item.text, '');
          content = outsideCode(content, text =>
            text
              .replace(/<HomeFeatures[^>]*>/g, '<CardGroup cols={3}>')
              .replaceAll('</HomeFeatures>', '</CardGroup>')
              .replace(
                /<HomeFeature\s+src=(\{[^}]+\}|"[^"]*")\s+alt="([^"]*)"(?:\s+title="([^"]*)")?\s*>/g,
                (_, src, alt, title) => `<Card title=${JSON.stringify(title ?? '')}><img src=${src} alt=${JSON.stringify(alt)} />\n`,
              )
              .replaceAll('</HomeFeature>', '\n</Card>'),
          );
          continue;
        }
        if (item.path.includes('/AccessibilityLinks')) {
          content = content.replace(item.text, '');
          content = outsideCode(content, text =>
            text
              .replace(
                /<FullscreenLink\s+content="([^"]+)"\s+parent=\{parentPath\}\s+story="([^"]+)"\s*\/>/g,
                (_, label, story) => {
                  if (!parentPath) {
                    throw new Error(`${page.file}: FullscreenLink without parentPath`);
                  }
                  return `[${label}](https://react.fluentui.dev/iframe.html?id=${encodeURIComponent(`${parentPath}--${story}`)})`;
                },
              )
              .replace(/<ScenariosListLink>([^<]+)<\/ScenariosListLink>/g, '[$1](/react/guide/accessibility/scenarios)'),
          );
          continue;
        }
        if (item.path.includes('/StoryPreview') || item.path.includes('/GuideExamples')) {
          content = content.replace(item.text, '');
          continue;
        }
        const modulePath = item.path.startsWith('.') ? resolve(dirname(join(sourceRoot, page.file)), item.path) : item.path;
        if (/\.(svg|png|webp|jpe?g|gif|webm|mp4)$/.test(item.path)) {
          const absolute = modulePath.startsWith('@repo/')
            ? join(app, '../..', modulePath.slice('@repo/'.length))
            : modulePath;
          const url = await publishAsset(absolute);
          content = content.replace(item.text, '');
          for (const binding of item.bindings) {
            content = outsideCode(content, text =>
              text.replace(new RegExp(`\\{${binding.local}\\}`, 'g'), JSON.stringify(url)),
            );
          }
          continue;
        }
        // Guide example collections: `{ description, examples }` modules rendered through GuideExamples.
        const guideTag = prose.match(/<GuideExamples\s+description=\{description\}\s+examples=\{examples\}\s*\/>/);
        if (guideTag && item.bindings.some(binding => binding.imported === 'examples')) {
          const module = (await vite.ssrLoadModule(modulePath)) as {
            description?: string;
            examples: Array<{ name: string; Preview: React.ComponentType; description?: string }>;
          };
          const islandName = uniqueIsland(`${collection}${pascal(basename(page.route))}Guide`);
          const bare = module.examples.map(example => example.name);
          // Expose each Preview as a named export through a tiny shim so the island can import it.
          const shim = join(root, `generated/${islandName}.examples.ts`);
          await write(
            shim,
            `import { examples } from ${JSON.stringify(modulePath)};\nexport default {};\n${bare
              .map(name => `export const ${name} = examples.find(example => example.name === ${JSON.stringify(name)})!.Preview;`)
              .join('\n')}\n`,
          );
          const shimModule = (await vite.ssrLoadModule(shim)) as StoryModule;
          const { styles } = await makeIsland({ name: islandName, modulePath: shim, module: shimModule, stories: [], bare, headless });
          islands.push(islandName);
          const sections = [styles, module.description ? storyMarkdown(module.description) : ''];
          for (const example of module.examples) {
            sections.push(`## ${example.name} [#${toKebabCase(example.name)}]`);
            if (example.description) {
              sections.push(storyMarkdown(example.description));
            }
            sections.push(`<${islandName} name=${JSON.stringify(example.name)} />`);
          }
          content = content.replace(item.text, '').replace(guideTag[0], sections.filter(Boolean).join('\n\n'));
          continue;
        }
        // Design-token expressions in inline <style> blocks: inline the CSS variable references.
        if (item.path === '@fluentui/react-components') {
          const tokensBinding = item.bindings.find(binding => binding.imported === 'tokens');
          if (tokensBinding) {
            const { tokens } = (await vite.ssrLoadModule('@fluentui/react-theme')) as { tokens: Record<string, string> };
            content = outsideCode(content, text =>
              text.replace(new RegExp(`\\b${tokensBinding.local}\\.([A-Za-z0-9_]+)`, 'g'), (_, name) => {
                if (!(name in tokens)) {
                  // The authored page references a token the theme does not define (renders `undefined` upstream too).
                  log(`${page.route}: unknown design token ${name}; emitting var(--${name})`);
                  return JSON.stringify(`var(--${name})`);
                }
                return JSON.stringify(tokens[name]);
              }),
            );
          }
          // Fluent Card used as page chrome maps to Blume's Card; CardHeader becomes a bold lead.
          if (item.bindings.some(binding => binding.imported === 'Card')) {
            content = outsideCode(content, text =>
              text
                .replace(/<Card\b[^>]*>/g, '<Card>\n')
                .replace(/<\/Card>/g, '\n</Card>')
                .replace(/<CardHeader\s+header=\{<h3>([^<]*)<\/h3>\}\s*\/>/g, '**$1**'),
            );
          }
          // Fluent Link in prose is just an anchor.
          if (item.bindings.some(binding => binding.imported === 'Link')) {
            content = outsideCode(content, text =>
              text.replace(/<Link\s+href=("[^"]+")[^>]*>/g, '<a href=$1>').replace(/<\/Link>/g, '</a>'),
            );
          }
          const remaining = item.bindings.filter(
            binding => !['tokens', 'Card', 'CardHeader', 'Link'].includes(binding.imported) && new RegExp(`<${binding.local}[\\s/>]`).test(prose),
          );
          if (remaining.length) {
            throw new Error(`${page.file}: ${remaining.map(binding => binding.local).join(', ')} from @fluentui/react-components used in prose`);
          }
          content = content.replace(item.text, '');
          continue;
        }
        // Remaining imports: components used as <StoryPreview story={X}/> or directly as JSX tags.
        const used = item.bindings.filter(binding => {
          const tag = new RegExp(`<StoryPreview\\s+story=\\{${binding.local}\\}|<${binding.local}[\\s/>]`);
          return tag.test(prose);
        });
        if (!used.length) {
          // Imported but never rendered in prose (only referenced inside code fences).
          content = content.replace(item.text, '');
          continue;
        }
        let module: StoryModule;
        try {
          module = (await vite.ssrLoadModule(modulePath)) as StoryModule;
        } catch (error) {
          throw new Error(`${page.file}: cannot load ${item.path}: ${(error as Error).message}`);
        }
        const previews = used.filter(binding => new RegExp(`<StoryPreview\\s+story=\\{${binding.local}\\}`).test(prose));
        const tags = used.filter(binding => !previews.includes(binding));
        const islandName = uniqueIsland(`${collection}${pascal(basename(page.route))}Preview`);
        const { styles } = await makeIsland({
          name: islandName,
          modulePath,
          module,
          stories: previews.map(binding => binding.imported),
          bare: tags.map(binding => binding.imported),
          headless,
        });
        islands.push(islandName);
        content = content.replace(item.text, `${styles}\n`);
        content = outsideCode(content, text => {
          for (const binding of previews) {
            text = text.replace(
              new RegExp(`<StoryPreview\\s+story=\\{${binding.local}\\}[^>]*/>`, 'g'),
              `<${islandName} name=${JSON.stringify(binding.imported)} />`,
            );
          }
          for (const binding of tags) {
            text = text.replace(
              new RegExp(`<${binding.local}(?=[\\s/>])([^>]*?)(/?)>`, 'g'),
              (_, attrs, selfClosing) => `<${islandName} name=${JSON.stringify(binding.imported)}${attrs}${selfClosing}>`,
            );
            text = text.replace(new RegExp(`</${binding.local}>`, 'g'), `</${islandName}>`);
          }
          return text;
        });
      }
      metadata[page.route] = { route: `/docs/${page.route}`, examples: 0, api: 0, islands };
    }

    content = htmlCommentsToMdx(content);

    // MDX `components` overrides (Fumadocs-style table decorators) have no Blume counterpart.
    content = content.replace(/^export const components = \{[^\n]*\};?\s*$/m, () => {
      log(`${page.route}: dropped MDX components override (rendered as a plain table)`);
      return '';
    });

    // Blume mounts everything under basePath; links written as `/docs/...` would double the prefix.
    content = outsideCode(content, text =>
      text.replace(/\]\(\/docs\//g, '](/').replace(/(href=["'])\/docs\//g, '$1/'),
    );

    const leftover = proseOnly(content).match(/^import\s+[\s\S]*?;[ \t]*$/m);
    if (leftover) {
      await write(join(root, 'generated/debug-leftover.mdx'), content);
      throw new Error(`${page.file}: unhandled import ${leftover[0]} (see generated/debug-leftover.mdx)`);
    }

    const data: Record<string, unknown> = {};
    if (page.data.title) {
      data.title = page.data.title;
    }
    if (page.data.description) {
      data.description = page.data.description;
    }
    const unknown = Object.keys(page.data).filter(key => !['title', 'description'].includes(key));
    if (unknown.length) {
      throw new Error(`${page.file}: frontmatter keys ${unknown.join(', ')} need a Blume mapping`);
    }
    stats.pages++;
    const outputFile = promotedPages.has(page.route) ? `${dirname(page.file)}/index.mdx` : page.file;
    const route = promotedPages.has(page.route) ? dirname(page.route) : page.route;
    if (route !== page.route) {
      metadata[route] = { ...metadata[page.route], route: `/docs/${route}` };
      delete metadata[page.route];
    }
    await write(join(root, 'content', outputFile), matter.stringify(`\n${content.trim()}\n`, data));
  }
} finally {
  await vite.close();
}

// Folder metadata: meta.json → meta.ts. `!page` exclusions become hidden pages.
for (const file of (await readdir(sourceRoot, { recursive: true })).filter(entry => entry.endsWith('meta.json'))) {
  const meta = JSON.parse(await readFile(join(sourceRoot, file), 'utf8'));
  const { pages: order = [], title, defaultOpen } = meta;
  for (const excluded of order.filter((entry: string) => entry.startsWith('!'))) {
    const target = join(root, 'content', dirname(file), `${excluded.slice(1)}.mdx`);
    const page = matter(await readFile(target, 'utf8'));
    await write(target, matter.stringify(page.content, { ...page.data, hidden: true }));
  }
  const folderRoute = dirname(file);
  const promotedChild = promoted.get(folderRoute)?.split('/').at(-1);
  await write(
    join(root, 'content', file.replace('meta.json', 'meta.ts')),
    `import { defineMeta } from 'blume';\n\nexport default defineMeta(${JSON.stringify(
      {
        ...(title ? { title } : {}),
        pages: order.filter((entry: string) => !entry.startsWith('!') && entry !== '...' && entry !== promotedChild),
        ...(defaultOpen !== undefined ? { collapsed: !defaultOpen } : {}),
        ...(promotedChild ? { directory: 'card' } : {}),
      },
      null,
      2,
    )});\n`,
  );
}

const contrib = await generateContrib({
  manifest: join(app, 'manifests/contrib/docs-manifest.json'),
  outDir: join(root, 'content/contrib'),
});
for (const route of contrib.routes) {
  metadata[route] = { route: `/docs/${route}`, examples: 0, api: 0, islands: ['StorybookEmbed'] };
}

await write(join(root, 'generated/islands.json'), JSON.stringify([...islandNames].sort()));
await write(join(root, 'generated/redirects.json'), JSON.stringify(redirects, null, 2));
await write(join(root, 'generated/pages.json'), JSON.stringify(metadata, null, 2));
await write(
  join(root, 'generated/stats.json'),
  JSON.stringify({ ...stats, contribPages: contrib.routes.length, generateMs: Date.now() - started }, null, 2),
);
log(
  `${stats.pages} pages, ${stats.componentPages} component pages, ${stats.stories} stories, ${stats.islands} islands, ${stats.apiTables} API tables, ${contrib.routes.length} contrib pages in ${Date.now() - started}ms`,
);
if (stats.ssrSkipped.length) {
  log(`client-only stories (SSR failed at generation): ${stats.ssrSkipped.length}`);
}

if (generateOnly) {
  process.exit(0);
}

const cli = join(dirname(require.resolve('blume/package.json')), 'bin/blume.mjs');
const result = spawnSync(process.execPath, [cli, command, ...process.argv.slice(3).filter(arg => arg !== '--generate-only')], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: command === 'build' ? 'production' : 'development' },
});
if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  throw new Error(`Blume ${command} failed (${result.status ?? result.signal})`);
}
if (command === 'build') {
  // Mirror every page's Markdown as `.txt`, the convention the Fumadocs app exposes.
  for (const route of Object.keys(metadata)) {
    // Blume writes `dist/docs/...` regardless of `deployment.base`; the base only prefixes URLs.
    const file = join(root, 'dist', 'docs', `${route}.md`);
    if (existsSync(file)) {
      await copyFile(file, file.replace(/\.md$/, '.txt'));
    }
  }
}
