# Blume 2 proof of concept: measurements

Protocol from the docsite RFC: `DOCSITE_BASE_PATH=/fluentui/`, clean `blume/dist`, three runs of
`yarn nx run public-docsite-v9-blume:build --skip-nx-cache`, median reported; page metrics from a Playwright cold
load; the sweep (`node blume/verify.mjs`) visits every built route. Measured 2026-10-14 on an Apple Silicon laptop.
Raw numbers: `metrics/metrics.json`, `metrics/verify.json`.

| Metric                                       | Value                                                                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build wall time (median of 3)                | 114 s (111 s, 114 s; first run 383 s with cold Vite caches). Content generation 80 s (905 stories server-rendered for Griffel collection), Astro build 23 s                                                                          |
| `dist/` size, total / JS                     | 156 MB / 11.4 MB JS (114 MB HTML, 14.8 MB `.mdx` copies, 6.2 MB `.txt`, 4.5 MB JSON incl. the 3.1 MB search index)                                                                                                                   |
| Transfer on the Button page (cold)           | 526 KB JS, 310 KB CSS, 611 KB HTML, 68 requests. Data Grid: 856 KB JS, 1.89 MB HTML. Contrib react-keytips: 252 KB JS, 175 KB HTML                                                                                                   |
| Pages built                                  | 333 HTML (310 reported by Blume: 268 content pages incl. 145 component pages and 41 contrib pages, plus redirects, 404 and API routes), 319 `.md` mirrors                                                                            |
| Custom plugins, adapters and generators      | 2,462 LoC in 24 files: `blume/generate.ts` 727, `generate-contrib.ts` 184, `story-config.ts` 94, `integration.ts` 61, `api.ts` 88, `Example.tsx` 108, 7 Vite plugins carried over (603), verification scripts 325                    |
| Framework pins and age-gate exceptions       | blume 2.1.3 (2.2.x gated by `npmMinimalAgeGate: 7d`), astro 7.3.6 (7.3.7+ gated), @astrojs/react 7.0.1, React 19.2.0 (blume nests react 19.3.0 and typescript 6.0.3; aliased to a single client React 19.2), Astro brings Vite 8.3.3 |
| Page errors / console errors in a full sweep | 309 routes, 0 page errors, 0 console errors (`registerPaint` errors raised inside the embedded contrib `houdini-utils` Storybook frame are filtered as upstream content)                                                             |
| Search                                       | "keytips" returns 4 hits (react-keytips contrib page, v8 migration pages); Orama default provider with the English-locale patch                                                                                                      |
| `llms.txt` and per-page markdown             | `llms.txt`, `llms-full.txt`, `/docs/<route>.md` mirror for every page, JSON API (`/api/docs/*`, `openapi.json`), `agent-readability.json`                                                                                            |
| Contrib pages rendered                       | 41 pages from 42 manifest entries (the duplicate `Rounded Corners` title collapses into one page), 140 stories as `StorybookEmbed` islands, 18 with source fences, 16 API tables                                                     |
| Islands and API tables                       | 177 generated story islands, 125 API tables with 1,243 rows; 2 stories skipped at server render time (`window` access) and rendered client-only                                                                                      |
| Accessibility score (optional)               | Not measured                                                                                                                                                                                                                         |

Smoke (`node blume/smoke.mjs`): Button 8/8 islands hydrated, Headless Button 1/1, Data Grid 15/15, contrib
react-keytips 1/5 (the rest are `client:visible` below the fold), contrib index renders. Screenshots in
`metrics/screenshots/`.
