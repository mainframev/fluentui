/**
 * Collects the numbers reported in METRICS.md: output size, page count, JS transferred on a cold
 * load of the Button page, custom code size, and the dependency pins. Build first.
 */
import { createServer } from 'node:http';
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const app = dirname(here);
const dist = join(here, 'dist');
const base = (process.env.DOCSITE_BASE_PATH ?? '/').replace(/\/$/, '');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])));
  return files.flat();
}
const files = await walk(dist);
const sizes = {};
for (const file of files) {
  const ext = extname(file) || '(none)';
  sizes[ext] = (sizes[ext] ?? 0) + (await stat(file)).size;
}
const total = Object.values(sizes).reduce((a, b) => a + b, 0);
const pages = files.filter(file => file.endsWith('index.html')).length;

const custom = ['blume', 'vite-plugins', 'mdx-plugins/component-api-source.ts', 'src/components/GuideExample.tsx'];
const loc = {};
for (const entry of custom) {
  const target = join(app, entry);
  const list = (await stat(target)).isDirectory() ? await walk(target) : [target];
  for (const file of list) {
    if (!/\.(ts|tsx|mjs|astro)$/.test(file) || /\/(dist|\.blume|content|generated|public)\//.test(file) || /islands\/generated/.test(file)) {
      continue;
    }
    const text = await readFile(file, 'utf8');
    loc[file.replace(`${app}/`, '')] = text.split('\n').filter(line => line.trim()).length;
  }
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    let file = join(dist, url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname);
    try {
      if ((await stat(file)).isDirectory()) {
        file = join(file, 'index.html');
      }
    } catch {
      file = `${file}.html`;
    }
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch {
    response.statusCode = 404;
    response.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}${base}`;
const browser = await chromium.launch();
const transfers = {};
for (const route of ['/docs/react/components/button', '/docs/react/components/data-grid', '/docs/contrib/packages/react-keytips']) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const bytes = { js: 0, css: 0, html: 0, json: 0, other: 0, requests: 0 };
  page.on('response', async response => {
    const url = new URL(response.url());
    if (url.origin !== new URL(origin).origin) {
      return;
    }
    let body = Buffer.alloc(0);
    try {
      body = await response.body();
    } catch {
      return;
    }
    bytes.requests++;
    const ext = extname(url.pathname);
    const kind = ext === '.js' ? 'js' : ext === '.css' ? 'css' : ext === '.json' ? 'json' : ext === '.html' || ext === '' ? 'html' : 'other';
    bytes[kind] += body.length;
  });
  await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every(island => !island.hasAttribute('ssr')), null, { timeout: 30000 }).catch(() => {});
  transfers[route] = bytes;
  await context.close();
}
await browser.close();
server.close();

const pins = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'));
const versions = {};
for (const name of ['blume', 'astro', '@astrojs/react', 'react', 'vite', 'typescript']) {
  try {
    versions[name] = JSON.parse(await readFile(join(app, '../../node_modules', name, 'package.json'), 'utf8')).version;
  } catch {
    versions[name] = pins.dependencies?.[name] ?? pins.devDependencies?.[name];
  }
}
versions['blume > react'] = JSON.parse(await readFile(join(app, '../../node_modules/blume/node_modules/react/package.json'), 'utf8')).version;
versions['blume > typescript'] = JSON.parse(await readFile(join(app, '../../node_modules/blume/node_modules/typescript/package.json'), 'utf8')).version;
versions['astro > vite'] = JSON.parse(await readFile(join(app, '../../node_modules/astro/node_modules/vite/package.json'), 'utf8')).version;

const stats = JSON.parse(await readFile(join(here, 'generated/stats.json'), 'utf8'));
const result = { pages, total, sizes, transfers, loc, locTotal: Object.values(loc).reduce((a, b) => a + b, 0), versions, stats, du: execSync(`du -sh ${dist}`).toString().trim() };
await mkdir(join(app, 'metrics'), { recursive: true });
await writeFile(join(app, 'metrics/metrics.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
