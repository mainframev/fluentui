# Testing Guide

## Test Types

| Type              | Tool                         | Command                                         | Purpose                          |
| ----------------- | ---------------------------- | ----------------------------------------------- | -------------------------------- |
| Unit              | Jest + React Testing Library | `yarn nx run <project>:test`                    | Component behavior, hooks, utils |
| Visual Regression | Storybook + StoryWright      | `yarn nx run vr-tests-react-components:test-vr` | Screenshot diffs (CI only)       |
| E2E               | Cypress                      | `yarn nx run react-components:e2e`              | Integration flows                |
| SSR               | Custom                       | `yarn nx run ssr-tests-v9:test-ssr`             | Server-side rendering safety     |
| Cross-React       | Custom                       | `yarn nx run rit-tests-v9:test-rit`             | React version compatibility      |
| Conformance       | isConformant                 | Part of unit tests                              | Consistent component API         |

## Writing Unit Tests

Tests live adjacent to the component they test:

```
components/Button/
├── Button.tsx
├── Button.test.tsx          ← here
└── ...
```

### What to Test

- Default rendering (snapshot)
- All prop variants
- User interactions (click, keyboard, focus)
- Accessibility (ARIA attributes, roles, keyboard navigation)
- Controlled and uncontrolled patterns
- Edge cases (null children, empty arrays, etc.)

### Updating Snapshots

If your change intentionally alters rendered output:

```bash
yarn nx run <project>:test -u
```

Review the snapshot diff to verify the change is correct before committing.

## E2E (Cypress Component Testing)

`cypress.config.js` files are **JavaScript on purpose** - do not convert them to TypeScript.

Cypress loads the config file in a child process where it registers its own bundled `ts-node` with
a hardcoded `moduleResolution: 'node'` (node10). TypeScript 6 rejects that with TS5107, so every
TypeScript file reachable from a `cypress.config.*` fails to load. The whole Node side of the
Cypress setup - the per project configs and the shared `@fluentui/scripts-cypress` entry point
(`scripts/cypress/src/base.config.js`) - is therefore plain CommonJS checked with `// @ts-check`.
The browser side (`scripts/cypress/src/browser`, `*.cy.tsx` specs) stays TypeScript, it is bundled
by webpack/esbuild-loader and never touched by Cypress' `ts-node`.

Path aliases for the bundler are wired explicitly by `scripts/cypress/src/ts-paths.js`, which
resolves `paths` against the compiler reported `pathsBasePath` of `tsconfig.base.json` and hands
that base to `tsconfig-paths-webpack-plugin`. Cypress' own `tsconfig-paths` registration (Node
side) logs `Missing baseUrl in compilerOptions. tsconfig-paths will be skipped` for `baseUrl`-less
(TypeScript 6) configs - that is inconsequential, the Cypress Node process resolves every workspace
package through its Yarn workspace `node_modules` symlink.

## Conformance Tests

Every component package has a `testing/isConformant.ts` file that validates:

- Component renders without crashing
- Ref forwarding works
- className merging works
- `as` prop (if applicable) works
- Accessibility basics

## SSR Safety

Components must work in server-side rendering. Never access browser APIs without guards:

```tsx
// WRONG — crashes on server
const width = window.innerWidth;

// RIGHT — guarded access
const width = typeof window !== 'undefined' ? window.innerWidth : 0;

// BETTER — use useIsSSR or check canUseDOM
import { canUseDOM } from '@fluentui/react-utilities';
if (canUseDOM()) {
  // safe to use window/document
}
```
