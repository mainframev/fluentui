# Blume 2 proof of concept — notes

Branch `feat/docsite-blume-v2`. The app is a copy of `apps/public-docsite-v9-fumadocs` with the
Fumadocs/React Router runtime replaced by a Blume 2 project under `blume/`. Authored content in
`content/` is untouched; everything Blume consumes is generated at build time.

## Pins

| Package               | Pin    | Note                                                                                                                                             |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blume`               | 2.1.3  | 2.2.0–2.2.3 were published less than 7 days before 2026-10-14 and are blocked by `npmMinimalAgeGate: 7d` (2.2.0 clears on 2026-10-14 06:13 UTC). |
| `astro`               | 7.3.6  | 7.3.7/7.3.8 gated.                                                                                                                               |
| `@astrojs/react`      | 7.0.1  | newest 7.x, clear.                                                                                                                               |
| `react` / `react-dom` | 19.2.0 | workspace version; Blume nests its own 19.3.0 (see below).                                                                                       |

## What `blume migrate fumadocs` handled vs. by hand

`npx blume migrate fumadocs` without an agent flag prints the path of the bundled `blume-migrate`
playbook (`node_modules/blume/skills/blume-migrate/SKILL.md` + `references/fumadocs.md`,
`references/monorepo.md`) and changes nothing. Applied from the playbook:

- `blume.config.ts` with `basePath: "/docs"` (the Fumadocs `baseUrl`), `deployment.base` from
  `DOCSITE_BASE_PATH`, header `navigation.tabs` for the three sections, Orama default search.
- `meta.json` → `meta.ts` (`defineMeta`), `!page` → `hidden: true` frontmatter, `...` dropped.
- `package.json` scripts/deps swapped (fumadocs-\*, react-router, tailwind removed; blume, astro,
  @astrojs/react added), lockfile regenerated.
- Frontmatter: only `title`/`description` were used, nothing to map.

Everything that makes this site a docsite was outside the playbook and is done by
`blume/generate.ts` (~700 lines) and `blume/generate-contrib.ts` (~200 lines):

- `<ComponentPage meta stories docgen>` cannot be an island (CSF namespaces are not serializable
  props). The generator loads every story module through a Vite SSR module runner, emits one island
  per page (`islands/generated/<Collection><Component>Stories.tsx`) that imports the CSF module and
  renders a story by `name`, and rewrites the page into plain MDX: component description, per story
  `## Name` + description + `<Island name />` + `<Expandable>` source fence, `## API` TypeTable.
- Griffel rules for every story's default state are collected at generation time
  (`renderToStaticMarkup` + `renderToStyleElements`) and inlined per page through a tiny
  `ExampleStyles.astro` component. Importing a CSS file from each island instead merged all
  73k rules into one 6 MB site-wide stylesheet, because Blume loads the whole content collection
  as one module graph.
- `SectionOverview` → `CardGroup`/`Card`; `HomeFeatures` → `CardGroup`; `FullscreenLink` /
  `ScenariosListLink` → links; `StoryPreview story={X}` and bare story components in guides →
  per-page islands; `GuideExamples` modules → islands via a generated re-export shim; asset imports
  → files copied into `public/assets` (Blume's staged content root breaks relative imports);
  design-token expressions in inline `<style>` → inlined CSS variables; HTML comments → MDX
  comments; `<br>` → `<br />`; `/docs/...` links → root links (Blume adds `basePath`).
- `X/X.mdx` next to `X/index.mdx` (Button, Card, Menu, ...) duplicated the sidebar label. The
  component page becomes the folder index, the hand-written overview is replaced by Blume's
  `directory: "card"` listing, and a redirect covers the old URL.
- MDX `export const components = { table: ColorMappingTable }` (color-mapping page) has no Blume
  counterpart; it renders as a plain table.
- Contrib: pre-generated from `manifests/contrib/docs-manifest.json` (41 entries → 41 pages,
  `meta.ts` from `titlePath`). A `custom()` ContentSource would have worked too, but the files
  must exist before `blume dev` can watch them and the generator already runs first; pre-generation
  keeps one code path and lets `blume validate` see the pages. Relative images in contrib READMEs
  become GitHub links.

## Adapters from the Blume 1.6.5 prototype on Blume 2.1.3 / Astro 7.3.6

| Adapter                                                                       | Status                                                                                                                                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orama English locale (`Intl.Locale("english").maximize()` throws in Chromium) | **Still required.** Blume 2 wraps the `Intl.Locale` constructor in try/catch but not `maximize()`; without the patch every search shows "Something went wrong". |
| Code-block enhancement excluding islands (`.prose pre:not(astro-island pre)`) | **Still required** (selector unchanged in `RootLayout.astro`).                                                                                                  |
| Fluent portal mount deferred until hydration                                  | **Still required** (library behaviour, independent of Blume).                                                                                                   |
| Tabster attributes emitted after hydration                                    | **Still required** (same).                                                                                                                                      |
| `@pierre/diffs` alias                                                         | Obsolete: Blume 2 externalizes its render-time deps itself.                                                                                                     |
| Dev-only React externalization for the SSR runner                             | Kept only in the generator's Vite server (`storyVite(false)`): absolute React aliases make Vite's module runner evaluate CommonJS React as ESM.                 |
| Prerender `noExternal: true`                                                  | Still used on `build` so hoisted copies cannot shadow importers' versions.                                                                                      |
| Vite 7/8 type boundary                                                        | Gone: the workspace vite is 6.4.2 (types only), the app installs vite 8.3.0 for the generator, Astro brings 8.3.3.                                              |

New on Blume 2: story modules must be imported by **absolute path**. Rolldown resolves
`@fluentui/react-tree-stories/src/Tree/index.stories` through the package entry
(`stories/src/index.ts/src/Tree/...`) and fails, whereas Vite's dev resolver follows the workspace
symlink.

## AutoTypeTable experiment (`experiments/auto-type-table`)

`<AutoTypeTable path="…/Button.types.ts" name="ButtonProps" />` builds in 2 s with Blume's bundled
TypeScript 6 and renders `icon?: Slot<'span'>`, `appearance`, `shape`, `size: ButtonSize` — but it
emits **288 rows** (every inherited DOM/ARIA prop, `children` as a conditional type) against the
9 own props the custom extractor keeps. Without an own-props filter it is not usable for Fluent
components, so `blume/api.ts` (TypeScript compiler, same filter as `mdx-plugins/fluent-type-table.ts`)
feeds Blume's `<TypeTable>`.

## Dependency observations

- **Dual React.** Blume depends on `react ^19.3.0`; the workspace pins 19.2.0, so
  `node_modules/blume/node_modules/react@19.3.0` exists next to the root copy. Blume's own React
  islands (assistant) would bundle 19.3 while ours bundle 19.2. The integration aliases
  `react`/`react-dom` to the root copy and dedupes; the built client has a single React 19.2.
- **TypeScript 6.** Blume bundles `typescript ^6.0.3` (nested); the workspace is on 5.7.3. Nothing
  in the app type-checks against TS 6; `AutoTypeTable` runs on it.
- Blume pins `@vitejs/plugin-react 6.1.1`; Astro 7 brings Vite 8.3.3 and Rolldown.
- Blume rejects Yarn PnP; the workspace uses node_modules linking, so no issue.

## Known gaps / blockers

- Server-rendered HTML is heavy: each story preview has its own `FluentProvider`, whose SSR emits a
  19 KB theme stylesheet, plus the page's Griffel rules (Button: 122 KB) and highlighted sources —
  ~600 KB HTML for the Button page before compression. The Fumadocs app renders previews on the
  client instead.
- Two stories fail to server-render at generation time and are rendered client-only.
- Standalone "open example in a new tab" pages and the synchronized page-wide theme picker from
  the Fumadocs app were not ported (each example has its own theme/RTL controls).
- `blume validate` was not run; redirects for promoted pages exist but inbound links to the old
  `/components/button/button` URLs go through the redirect page.
- One remaining `BLUME_NAV_DUPLICATE_LABEL` warning ("Motion" under "Motion").
- The embedded fluentui-contrib Storybook for `houdini-utils` throws `registerPaint` errors inside
  its own frames; the verify sweep ignores that message.
