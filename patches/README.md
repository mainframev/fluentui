# Patches

Patches in this folder are applied to `node_modules` on `postinstall` via
[patch-package](https://github.com/ds300/patch-package) (`yarn patch-package`, see the root
`package.json` `postinstall` script).

Every patch must be documented here with **what** it changes and **when it can be removed**.

## `@swc-node/register+1.9.2`

`@swc-node/register` is what Nx uses to execute the TypeScript files of this workspace
(`just.config.ts`, executors, generators, plugins, ...).

**What it changes:** `tsCompilerOptionsToSwcConfig()` maps the TypeScript `baseUrl` to SWC's
`jsc.baseUrl`, which is the base every `paths` alias is resolved against. TypeScript 6 removed
`baseUrl` and resolves `paths` relative to the tsconfig file which declares them, reporting that
directory as `pathsBasePath`. Without the patch SWC either panics or resolves every alias against
the process cwd. The patch falls back to `pathsBasePath` (matching what newer Nx versions ship) and
throws an actionable error when `paths` are declared but neither base is available, instead of
silently resolving aliases against the wrong directory.

**Related pin:** `resolutions["@swc-node/core"] = "1.13.3"` in the root `package.json`.
`@swc-node/register@1.9.2` depends on `@swc-node/core@^1.13.1`. Newer `@swc-node/core` releases
raise their `@swc/core` peer requirement above the repo wide `@swc/core@1.11.24`, so without the
resolution the install resolves to a version whose peer dependency cannot be satisfied. `1.13.3`
declares `"@swc/core": ">= 1.4.13"`, which `1.11.24` satisfies.

**Removal:** drop the patch (and re-evaluate the pin) once the workspace moves to an `@nx/js`
version that installs `@swc-node/register >= 1.10`, which handles `pathsBasePath` upstream.

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
