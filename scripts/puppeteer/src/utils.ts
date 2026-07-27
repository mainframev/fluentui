import * as puppeteer from 'puppeteer';

import type { LaunchOptions } from './types';

export async function launch(options: LaunchOptions = {}) {
  const maxAttempts = 5;
  const launchOptions =
    process.platform === 'linux' && process.env.CI
      ? { ...options, args: [...(options.args ?? []), '--no-sandbox', '--disable-setuid-sandbox'] }
      : options;

  let attempt = 1;

  let browser: puppeteer.Browser | undefined;

  console.log(`puppeteer: launching with settings: ${JSON.stringify(launchOptions)}`);

  while (!browser) {
    try {
      browser = await puppeteer.launch(launchOptions);
      console.log('puppeteer: launched...');
    } catch (err) {
      if (attempt === maxAttempts) {
        console.error(`puppeteer: launch failed 5 attempts`);
        throw err;
      }
      console.warn(`puppeteer: launch failed (will retry ${maxAttempts - attempt} more times)`);
      console.warn(err);

      attempt++;
    }
  }

  return browser;
}

export async function visitUrl(page: puppeteer.Page, url: string) {
  const TEN_SECONDS = 10 * 1000;
  const maxAttempts = 5;
  let attempt = 1;

  console.log(`puppeteer: loading url "${url}"...`);

  while (attempt <= 5) {
    try {
      await page.goto(url, { timeout: TEN_SECONDS });
      console.log(`puppeteer: url loaded...`);
      break;
    } catch (err) {
      if (attempt === maxAttempts) {
        console.error(`puppeteer: failed to navigate to a page after 5 attempts...`);
        throw err;
      }

      console.warn(`puppeteer: failed to navigate to a page (will retry ${maxAttempts - attempt} more times)...`);
      console.warn(err);

      attempt++;
    }
  }
}
