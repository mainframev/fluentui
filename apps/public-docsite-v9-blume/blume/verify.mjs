/**
 * Serves `dist/` statically (honouring DOCSITE_BASE_PATH) and sweeps every generated page in
 * Chromium, failing on uncaught page errors, console errors, unhydrated islands and failed previews.
 * Set VERIFY_ROUTES to a comma-separated list to check only those routes.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, 'dist');
const base = (process.env.DOCSITE_BASE_PATH ?? '/').replace(/\/$/, '');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.md': 'text/plain',
  '.mdx': 'text/plain',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    // Astro keeps `dist/` flat; the base is only a URL prefix.
    let file = join(root, url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname);
    try {
      if ((await stat(file)).isDirectory()) {
        file = join(file, 'index.html');
      }
    } catch {
      file = `${file}.html`;
    }
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch (error) {
    response.statusCode = error.code === 'ENOENT' ? 404 : 500;
    response.end(String(error));
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}${base}`;
const pages = JSON.parse(await readFile(join(here, 'generated/pages.json'), 'utf8'));
const routes = process.env.VERIFY_ROUTES
  ? process.env.VERIFY_ROUTES.split(',')
  : Object.values(pages).map(entry => entry.route);
const browser = await chromium.launch({ headless: true });
const errors = [];
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') {
      return;
    }
    // The shared Image/Fallback story deliberately requests a missing image.
    if (/non-existing-png\.jpg/.test(message.location().url) || /non-existing/.test(message.text())) {
      return;
    }
    errors.push(`${page.url()}: console: ${message.text()}`);
  });
  for (const route of routes) {
    const before = errors.length;
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'load' });
    assert.equal(response.status(), 200, route);
    await page
      .waitForFunction(() => [...document.querySelectorAll('astro-island')].every(island => !island.hasAttribute('ssr')), null, {
        timeout: 30000,
      })
      .catch(() => errors.push(`${route}: islands did not hydrate within 30s`));
    const alerts = (await page.locator('[role="alert"]').allTextContents()).filter(text => /failed to render|Unknown example/.test(text));
    for (const alert of alerts) {
      errors.push(`${route}: ${alert}`);
    }
    const islands = await page.locator('astro-island').count();
    results.push({ route, islands, errors: errors.length - before });
    process.stdout.write(`${route}: ${islands} islands${errors.length > before ? ` ${errors.length - before} error(s)` : ''}\n`);
  }
  if (process.env.VERIFY_SEARCH) {
    await page.goto(`${origin}/docs/react/components/button/button`);
    await page.locator('[data-blume-search-open]').first().click();
    await page.locator('[data-blume-search-input]').fill(process.env.VERIFY_SEARCH);
    await page.waitForTimeout(1500);
    const hits = await page.locator('dialog a[href]').allTextContents();
    process.stdout.write(`search "${process.env.VERIFY_SEARCH}": ${hits.length} hits: ${hits.slice(0, 5).join(' | ')}\n`);
    assert.ok(hits.length > 0, `search for ${process.env.VERIFY_SEARCH} returned nothing`);
  }
} finally {
  await browser.close();
  server.close();
}
await mkdir(join(here, '../metrics'), { recursive: true });
await writeFile(join(here, '../metrics/verify.json'), JSON.stringify({ routes: results, errors }, null, 2));
process.stdout.write(`${routes.length} routes, ${errors.length} error(s) (metrics/verify.json)\n`);
if (errors.length) {
  for (const error of errors) {
    process.stdout.write(` - ${error}\n`);
  }
  process.exit(1);
}
