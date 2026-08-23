# Patches

Patches in this folder are applied to `node_modules` on `postinstall` via
[patch-package](https://github.com/ds300/patch-package) (`yarn patch-package`, see the root
`package.json` `postinstall` script).

Every patch must be documented here with **what** it changes and **when it can be removed**.

## `@swc-node/register+1.9.2`

`@swc-node/register` is only an _optional peer dependency_ of `nx` itself (see
`node_modules/nx/package.json`) - it is not installed by `@nx/js` or any other Nx package. Without
it present in the workspace, Nx falls back to its `ts-node` transpiler to execute the TypeScript
files of this workspace (`just.config.ts`, executors, generators, plugins, ...), and that fallback
is not TypeScript 6 compatible. This branch adds `@swc-node/register` directly to the root
`package.json` `devDependencies` so it is actually installed, which makes Nx pick it over the
`ts-node` fallback and execute those files as SWC transpile-only instead.

**Related CI setting:** Nx only picks SWC when `NX_PREFER_TS_NODE` is _not_ `true` (see
`node_modules/nx/src/plugins/js/utils/register.js`). The variable used to be set in every GitHub
workflow and in `.devops/templates/variables.yml`; it was removed there because the `ts-node`
fallback it forces hardcodes `moduleResolution: node10` and therefore fails with TS5107 under
TypeScript 6. Do not reintroduce it.

**Related root tsconfig setting:** `tsconfig.base.json` spells out `"esModuleInterop": true`, which
is already the TypeScript 6 default. `@swc-node/register@1.9.2` reads the raw `compilerOptions` and
falls back to the pre TypeScript 6 default of `false` when the option is absent, which strips the
interop wrappers and makes `import x from '<commonjs module>'` resolve to `undefined` in everything
Nx executes (generators, executors, `verify-packaging`, ...). Covered by
`scripts/package-manager/src/patches.spec.ts`.

**What the patch changes:** `tsCompilerOptionsToSwcConfig()` maps the TypeScript `baseUrl` to SWC's
`jsc.baseUrl`, which is the base every `paths` alias is resolved against. TypeScript 6 removed
`baseUrl` and resolves `paths` relative to the tsconfig file which declares them, reporting that
directory as `pathsBasePath`. Without the patch SWC either panics or resolves every alias against
the process cwd. The patch falls back to `pathsBasePath` (matching what newer `@swc-node/register`
versions ship) and throws an actionable error when `paths` are declared but neither base is
available, instead of silently resolving aliases against the wrong directory.

**Related pin:** `resolutions["@swc-node/core"] = "1.13.3"` in the root `package.json`.
`@swc-node/register@1.9.2` depends on `@swc-node/core@^1.13.1`. Newer `@swc-node/core` releases
raise their `@swc/core` peer requirement above the repo wide `@swc/core@1.11.24`, so without the
resolution the install resolves to a version whose peer dependency cannot be satisfied. `1.13.3`
declares `"@swc/core": ">= 1.4.13"`, which `1.11.24` satisfies.

**Removal:** this is actionable, not merely aspirational - bump the direct `@swc-node/register` pin
(and drop this patch, and re-evaluate the `@swc-node/core` resolution) as soon as an unpatched
`@swc-node/register` release maps `pathsBasePath` upstream (tracked in the `@swc-node/register`
release notes and CHANGELOG for a version `> 1.9.2`, expected around `1.10`+). Once such a version
is installed, first try removing the patch alone: if `yarn install` (patch-package) and
`scripts/package-manager/src/patches.spec.ts` succeed without it, the pin/patch pair is obsolete and
both can be removed together.

**Tests:** `scripts/package-manager/src/patches.spec.ts`

## `just-task+1.5.0`

**What it changes:** `just-task` hardcodes `moduleResolution: 'node'` when it registers `ts-node`
to load `just.config.ts`. `node10` resolution is deprecated in TypeScript 6 (TS5107) and makes every
v8 `just-scripts` target fail before it starts. The patch switches it to `bundler`, which is the
resolution mode the v8 configs use.

**Removal:** when the v8 build stops using `just-scripts`, or `just-task` stops overriding
`moduleResolution`.

## `@typescript-eslint+eslint-plugin+8.64.0`, `storywright+0.0.27-storybook7.14`

Pre-existing patches, unrelated to the TypeScript 6 migration.
