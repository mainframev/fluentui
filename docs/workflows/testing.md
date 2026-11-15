# Testing Guide

## Test Types

| Type              | Tool                         | Command                                         | Purpose                                             |
| ----------------- | ---------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| Unit              | Jest + React Testing Library | `yarn nx run <project>:test`                    | Component behavior, hooks, utils                    |
| Visual Regression | Storybook + StoryWright      | `yarn nx run vr-tests-react-components:test-vr` | Screenshot diffs (CI only)                          |
| E2E               | Cypress                      | `yarn nx run <project>:e2e`                     | Integration flows (projects with cypress.config.ts) |
| SSR               | Custom                       | `yarn nx run ssr-tests-v9:test-ssr`             | Server-side rendering safety                        |
| Cross-React       | Custom                       | `yarn nx run rit-tests-v9:test-rit`             | React version compatibility                         |
| Conformance       | isConformant                 | Part of unit tests                              | Consistent component API                            |

To run E2E for everything affected by your branch: `yarn nx affected -t e2e`.

## V9 Icon Regression Coverage

The v9 VRT project shares SVG/font icon examples between StoryWright screenshot
capture and Playwright browser assertions:

```bash
yarn nx run vr-tests-react-components:test-vr
yarn nx run vr-tests-react-components:e2e
```

See the [project README](../../apps/vr-tests-react-components/README.md) for build
modes and coverage, and the [Storybook tooling README](../../scripts/storybook/README.md#configurereacticons)
for shared icon configuration.

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

### Motion Preferences in Browser Tests

When asserting animation lifecycles, explicitly emulate `prefers-reduced-motion: no-preference` rather than relying on the runner's operating-system setting. Emulate `reduce` for reduced-motion cases and clear media emulation in `afterEach` so settings do not leak between tests.

## Conformance Tests

Every component package has a `testing/isConformant.ts` file that validates:

- Component renders without crashing
- Ref forwarding works
- className merging works
- `as` prop (if applicable) works
- Accessibility basics

## SSR Safety

Components must work in server-side rendering. Never access browser globals directly:

```tsx
// WRONG — crashes on the server, and targets the wrong window inside iframes / multi-window apps
const width = window.innerWidth;

// WRONG — SSR-safe, but still ignores iframes / multi-window (breaks AGENTS.md critical rule 3)
const width = typeof window !== 'undefined' ? window.innerWidth : 0;

// RIGHT (components) — use the document Fluent renders into
import { useFluent_unstable as useFluent } from '@fluentui/react-shared-contexts';
const { targetDocument } = useFluent();
const width = targetDocument?.defaultView?.innerWidth ?? 0;

// RIGHT (non-component code) — check the environment first
import { canUseDOM } from '@fluentui/react-utilities';
if (canUseDOM()) {
  // safe to use the DOM
}
```
