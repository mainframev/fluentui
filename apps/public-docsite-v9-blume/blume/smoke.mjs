/**
 * Chromium smoke of the five representative pages: islands hydrate, no page errors, search finds
 * "keytips", the Markdown mirror and llms.txt exist. Writes screenshots to metrics/screenshots/.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, 'dist');
const base = (process.env.DOCSITE_BASE_PATH ?? '/').replace(/\/$/, '');
const shots = join(here, '../metrics/screenshots');
await mkdir(shots, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.md': 'text/markdown', '.txt': 'text/plain', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
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
const browser = await chromium.launch();
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
  page.on('console', message => message.type() === 'error' && errors.push(`${page.url()}: console: ${message.text()}`));
  const routes = [
    '/docs/react/components/button',
    '/docs/headless/components/button',
    '/docs/react/components/data-grid',
    '/docs/contrib/packages/react-keytips',
    '/docs/contrib',
  ];
  for (const route of routes) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, route);
    await page.waitForFunction(
      () => [...document.querySelectorAll('astro-island')].every(island => !island.hasAttribute('ssr') || island.getAttribute('client') === 'visible'),
      null,
      { timeout: 30000 },
    );
    const islands = await page.locator('astro-island:not([ssr])').count();
    const total = await page.locator('astro-island').count();
    const previews = await page.locator('[data-fluent-preview], [data-storybook-embed]').count();
    const markdown = await page.request.get(`${origin}${route}.md`);
    assert.equal(markdown.status(), 200, `${route}.md`);
    const text = await markdown.text();
    assert.ok(!/<(React|Headless)\w+Stories|<ExampleStyles/.test(text), `${route}.md leaks island markup`);
    process.stdout.write(`${route}: ${islands}/${total} islands hydrated, ${previews} previews, ${text.length} Markdown chars\n`);
    await page.screenshot({ path: join(shots, `${route.slice(6).replace(/\//g, '-')}.png`), fullPage: false });
  }
  // Interact: theme switch and RTL on the Button page.
  await page.goto(`${origin}/docs/react/components/button`);
  await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every(island => !island.hasAttribute('ssr')));
  await page.getByRole('switch', { name: 'Right-to-left' }).first().check();
  assert.equal(await page.locator('[data-fluent-preview] > .fui-FluentProvider').first().getAttribute('dir'), 'rtl');
  await page.getByLabel('Theme').first().selectOption('web-dark');
  await page.getByText('Show code', { exact: true }).first().click();
  await page.screenshot({ path: join(shots, 'react-components-button-dark-rtl.png') });
  // Search
  await page.locator('[data-blume-search-open]').first().click();
  await page.locator('[data-blume-search-input]').fill('keytips');
  await page.locator('[data-blume-search-results] [role="option"], [data-blume-search-results] a[href]').first().waitFor({ timeout: 10000 });
  const hits = await page.locator('[data-blume-search-results] [role="option"], [data-blume-search-results] a[href]').allTextContents();
  assert.ok(hits.some(text => /keytips/i.test(text)), `search hits: ${hits.join(' | ')}`);
  process.stdout.write(`search "keytips": ${hits.length} hits\n`);
  await page.screenshot({ path: join(shots, 'search-keytips.png') });
  for (const file of ['/llms.txt', '/llms-full.txt', '/docs/react/components/button.txt', '/blume-search.json']) {
    assert.equal((await page.request.get(`${origin}${file}`)).status(), 200, file);
  }
  process.stdout.write('llms.txt, llms-full.txt, .txt mirror and search index present\n');
} finally {
  await browser.close();
  server.close();
}
assert.deepEqual(errors, [], `page errors:\n${errors.join('\n')}`);
process.stdout.write('smoke passed\n');
