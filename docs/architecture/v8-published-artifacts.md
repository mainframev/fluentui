# v8 published artifacts (post TypeScript 6)

TypeScript 6 removed `target: es5` and `module: amd`. v8 packages (`packages/react` &
friends) publish exactly those artifacts, so the way they are produced changed even though the
published contract did not. This page documents the contract and what consumers can observe.

## Module configuration

v8 packages emit their published JavaScript with `tsc` directly (via `just-scripts build`), so the
`module` compiler option controls the shipped artifact. To keep the CommonJS output byte-stable,
v8 packages keep `module: commonjs`.

TypeScript 6 deprecates the classic Node resolver (`moduleResolution: node`/`node10`) with
`TS5107`, and the modern resolvers (`node16`/`nodenext`) cannot be paired with `module: commonjs`
(`TS5110`). Because changing `module` would change the published artifact, v8 stays on
`module: commonjs` + `moduleResolution: node10` and silences the deprecation with
`ignoreDeprecations: "6.0"` in `tsconfig.base.v8.json`. This is a scoped, maintenance-only stopgap:
`node10` is removed in TypeScript 7, at which point v8 (or its resolver) must be revisited.

v9 packages differ: they emit JS via SWC (`.swcrc`), so `tsc` only type-checks and emits
declarations. They use the non-deprecated `module: nodenext` + `moduleResolution: nodenext`, which
does not affect their shipped JS.

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

### 1. SWC downlevel helpers are inlined (no new runtime dependency)

TypeScript 6 removed `target: es5`, so the ES5/AMD downlevel moved out of the compiler into SWC.
SWC's downlevel and module-interop helpers are **inlined** into each emitted file rather than
imported from `@swc/helpers`.

Inlining is deliberate: external helpers would add `@swc/helpers` as a new runtime dependency to
every `ships-es5` v8 package. v8 is maintenance-only, and adding a runtime dependency to ~40
published maintenance packages is a contract change we avoid. The cost is a small size increase
(~13% of `lib`, ~21% of `lib-amd`), which is immaterial for frozen legacy artifacts. The v8
dependency graph is therefore unchanged from before the migration.

### 2. `esModuleInterop` is unchanged for v8

`esModuleInterop` is **not** implied by `module: commonjs`, so v8's CommonJS emit is unchanged: v8
packages never set `esModuleInterop` and still do not, so `import * as React from 'react'` keeps
emitting the plain `var React = require('react')` form it always did.

(Note: `module: nodenext` *does* imply `esModuleInterop: true`, so the v9 base sets it explicitly to
match its own module mode; that only affects v9 declaration/type-checking, not the v8 CJS emit.)
