import { polyfillBodyAndObserve } from '@microsoft/focusgroup-polyfill/shadowless';

import * as rootPreview from '../../../.storybook/preview';
import { getActiveVariant } from '../../../packages/react-components/react-storybook-addon-variants/src';
import '../../../packages/react-components/react-storybook-addon-variants/src/styles.css';

polyfillBodyAndObserve();

/** @type {typeof rootPreview.decorators} */
export const decorators = [...rootPreview.decorators];

/**
 * Sandbox-side `<App>` wrapper used by *every* variant — wraps the example in
 * the headless `Provider`. Stays the same regardless of which variant is
 * active; the variant only changes how `src/example.tsx` and the bundler
 * config look.
 */
const sandboxApp = `import { Provider } from '@fluentui/react-headless-components-preview';
import { Example } from './example';

const App = () => (
  <Provider>
    <Example />
  </Provider>
);

export default App;
`;

const TAILWIND_DEV_DEPS = ['tailwindcss', '@tailwindcss/vite'];

/**
 * Apply Tailwind 4 to the generated sandbox: wire `src/index.css` to import
 * tailwind, register the vite plugin in `vite.config.ts`. This is the
 * default path — every story gets it unless its active variant declares an
 * alternative bundler shape (e.g. CSS Modules, see below).
 */
function applyTailwindSandbox(/** @type {Record<string, string>} */ files) {
  return {
    ...files,
    'src/index.css': '@import "tailwindcss";\n',
    'src/App.tsx': sandboxApp,
    'src/index.tsx': `import './index.css';\n${files['src/index.tsx']}`,
    'vite.config.ts': files['vite.config.ts']
      .replace(
        "import react from '@vitejs/plugin-react'",
        "import react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'",
      )
      .replace('plugins: [react()]', 'plugins: [react(), tailwindcss()]'),
  };
}

/**
 * Apply CSS Modules to the generated sandbox:
 * - swap `App.tsx` for the Provider wrapper
 * - drop a `vite-env.d.ts` so TypeScript recognises `*.module.css` imports
 *   (vite handles them at build, but the bundled tsconfig has no ambient
 *   types — without this the sandbox shows `Cannot find module './X.module.css'`)
 * - strip Tailwind-only devDependencies out of the eagerly-declared
 *   `package.json` (Storybook reads deps statically; we reconcile at click)
 */
function applyCssModulesSandbox(/** @type {Record<string, string>} */ files) {
  const next = {
    ...files,
    'src/App.tsx': sandboxApp,
    'src/vite-env.d.ts': '/// <reference types="vite/client" />\n',
  };
  if (next['package.json']) {
    try {
      const pkg = JSON.parse(next['package.json']);
      if (pkg.devDependencies) {
        for (const key of TAILWIND_DEV_DEPS) {
          delete pkg.devDependencies[key];
        }
      }
      next['package.json'] = JSON.stringify(pkg, null, 2);
    } catch {
      // If the addon's package.json output ever stops being JSON, skip the
      // strip rather than breaking the whole sandbox.
    }
  }
  return next;
}

/**
 * Overlay the variant's source files onto the sandbox `src/` tree:
 * - the variant's `.tsx` source becomes `src/example.tsx`
 * - any non-tsx files (e.g. `*.module.css`) are dropped under `src/<name>`
 */
function overlayVariantFiles(
  /** @type {Record<string, string>} */ files,
  /** @type {import('../../../packages/react-components/react-storybook-addon-variants/src').ActiveVariant} */ active,
  /** @type {string} */ storyExportToken,
) {
  const next = { ...files };
  const tsxFile =
    (active.activeFile && /\.tsx?$/.test(active.activeFile.name) ? active.activeFile : undefined) ??
    active.files.find(f => /\.tsx?$/.test(f.name));
  if (tsxFile) {
    next['src/example.tsx'] = `${tsxFile.source}\nexport { ${storyExportToken} as Example };\n`;
  }
  for (const file of active.files) {
    if (/\.tsx?$/.test(file.name)) continue;
    next[`src/${file.name}`] = file.source;
  }
  return next;
}

/** @type {typeof rootPreview.parameters} */
export const parameters = {
  ...rootPreview.parameters,
  docs: {
    ...rootPreview.parameters.docs,
  },
  options: {
    storySort: {
      method: 'alphabetical',
      order: ['Introduction', 'Headless Components'],
    },
  },
  exportToSandbox: {
    ...rootPreview.parameters.exportToSandbox,
    devDependencies: {
      // Static deps — Storybook reads them eagerly. The CSS-Modules variant
      // strips the Tailwind-only entries out of `package.json` at click time
      // (see `applyCssModulesSandbox`).
      tailwindcss: '^4.0.0',
      '@tailwindcss/vite': '^4.0.0',
    },
    transformFiles: (/** @type {Record<string, string>} */ files, ctx) => {
      const active = getActiveVariant(ctx);
      // No variants on this story → fall back to the Tailwind sandbox shape
      // (the headless docsite default).
      if (!active) return applyTailwindSandbox(files);

      let next = overlayVariantFiles(files, active, ctx.storyExportToken);

      if (active.key === 'css') {
        next = applyCssModulesSandbox(next);
      } else {
        next = applyTailwindSandbox(next);
      }
      return next;
    },
  },
};

export const tags = ['autodocs'];
