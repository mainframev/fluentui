# v8 published artifacts (post TypeScript 6)

TypeScript 6 removed `target: es5` and `module: amd`, and flipped the `esModuleInterop` default.
v8 packages (`packages/react` & friends) publish exactly those artifacts, so the way they are
produced - and in two places what they look like - changed. This page documents the contract and
what consumers can observe.

## What each artifact is and how it is produced

| Artifact       | Module format | ECMAScript baseline                                 | Produced by                             |
| -------------- | ------------- | --------------------------------------------------- | --------------------------------------- |
| `lib`          | ESM           | `ships-es5` -> ES5, otherwise the tsconfig `target` | `tsc` (+ SWC downlevel for `ships-es5`) |
| `lib-commonjs` | CommonJS      | `ships-es5` -> ES5, otherwise the tsconfig `target` | `tsc` (+ SWC downlevel for `ships-es5`) |
| `lib-amd`      | AMD           | always ES5                                          | SWC, from the emitted `lib`             |
| `dist`         | bundle / dts  | n/a                                                 | webpack / API Extractor                 |

- `tsc` type checks, emits declarations and modern JS.
- SWC downlevels/re-modularizes that output (`scripts/tasks/src/swc/transpile.ts`), which is the
  same split converged packages shipping AMD (`@fluentui/react-portal-compat`) already used.
- `lib-amd` is a fully derived directory: it always mirrors `lib` and stale files are pruned.

### `ships-es5` is explicit project metadata

Whether a package publishes ES5 **cannot** be derived from any other metadata - eg
`@fluentui/react-icons-mdl2` ships AMD but its `lib`/`lib-commonjs` were emitted as ES2019. Every
project whose tsconfig declared `target: es5` before the migration therefore carries the
`ships-es5` tag in its `project.json`, and that tag is the only thing which enables the downlevel
step (`ts:downlevel`) - see `scripts/tasks/src/metadata-utils.ts#shipsES5`.

`verify-packaging` asserts the published files actually match this contract (module shape,
ECMAScript baseline, declaration counterparts, `lib-amd`/`lib` parity).

## Behaviour changes for consumers

### 1. `@swc/helpers` is a new runtime dependency

The downlevel/module helpers are imported from `@swc/helpers` instead of being inlined into every
emitted file (which added ~13% to `lib` and ~21% to `lib-amd`). Every affected package declares
`@swc/helpers` as a `dependency`, exactly like the converged packages compiled by SWC.

For AMD consumers this means the emitted `define([...])` lists `@swc/helpers/_/<helper>` modules in
addition to the already present `tslib`.

`@swc/core` grows and renames its helper set over time (eg `_create_super` was replaced by
`_call_super`), so the emitted output and the declared `@swc/helpers` range can drift apart - the
artifact would then fail with `MODULE_NOT_FOUND` in a consumer's app. `verify-packaging` therefore
resolves every `@swc/helpers/...` specifier found in the published JavaScript against the package
itself and fails the build when one of them is not provided. If that check trips, raise the
`@swc/helpers` version **repo wide** (all packages declare the same range, which `syncpack`
enforces) instead of per package.

### 2. `esModuleInterop` is on (CJS + AMD only)

TypeScript 6 deprecates `esModuleInterop: false` (TS5107) and defaults the option to `true`. v8
packages never set it, so their CommonJS emit changed:

```ts
// src
import * as React from 'react';
```

```js
// lib-commonjs - before (esModuleInterop: false)
var React = require('react');

// lib-commonjs - now (esModuleInterop: true, `importHelpers` -> helper comes from tslib)
var tslib_1 = require('tslib');
var React = tslib_1.__importStar(require('react'));
```

`lib-amd` gets the same treatment through the SWC helper (`_interop_require_wildcard`), which
additionally caches the created namespace object per module.

What this means:

- **Public API is unchanged.** Named and default exports of our packages resolve exactly as before.
- **Namespace objects are copies.** Inside our emitted CJS/AMD code, `React` is no longer the very
  same object as `require('react')` - it is a namespace object with the module's own properties
  plus a `default`. Identity checks (`ns === require('x')`) and mutation of an imported namespace
  are the only observable differences, and neither is a supported pattern.
- **ESM output (`lib`) is unaffected** - interop only exists in the CommonJS/AMD emit.

This is not opt-out-able: `esModuleInterop: false` is removed in TypeScript 7 and the repo does not
use `ignoreDeprecations`.

Smoke tests for the emitted interoperability shape live in
`scripts/tasks/src/swc/interop.spec.ts`.
