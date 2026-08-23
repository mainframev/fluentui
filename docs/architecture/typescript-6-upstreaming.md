# Upstreaming this TypeScript 6 migration

This branch doubles as the **fork validation vehicle**: it runs the fork's CI on GitHub-hosted
Ubuntu runners so the migration can be exercised end-to-end before an upstream
`microsoft/fluentui` PR exists. As a result the workflow files mix two kinds of change that must be
**separated** when the upstream PR is opened.

## Keep (real TypeScript 6 fixes)

These are genuine migration fixes and belong upstream unchanged:

- **Remove `NX_PREFER_TS_NODE: true`** from all 8 workflow files and `.devops/templates/variables.yml`.
  `NX_PREFER_TS_NODE` forces Nx onto its `ts-node` fallback, which hardcodes `moduleResolution:
  node10` and fails under TypeScript 6 with `TS5107`. With it removed, Nx uses the
  `@swc-node/register` path this branch installs.
- Any `@swc-node/register` install / setup steps added for the above.

## Drop (fork-only plumbing)

Everything gated on `github.repository_owner == 'mainframev'` is fork-only and must be reverted to
the upstream `microsoft`-owner behavior:

| File                              | Fork-only change to drop                                                  |
| --------------------------------- | ------------------------------------------------------------------------- |
| `pr.yml`                          | Ubuntu runner routing, `NX_PARALLEL`/`FLUENT_JEST_WORKER` tuning, fork job enablement (12 conditionals) |
| `pr-vrt.yml`                      | Ubuntu routing + fork enablement (4)                                      |
| `pr-website-deploy.yml`           | Ubuntu routing + fork enablement (4)                                      |
| `check-packages.yml`              | Ubuntu routing (3)                                                        |
| `check-tooling.yml`               | Ubuntu routing + skip git-hook setup (3)                                  |
| `bundle-size.yml`                 | Ubuntu routing + inaccessible-baseline warning (3)                        |
| `bundle-size-comment.yml`         | fork gate (1)                                                             |

Restore each `runs-on` to `macos-14-xlarge` and each `if:` to `github.repository_owner ==
'microsoft'`, and restore `NX_PARALLEL: 6` (macOS larger runner) where the fork lowered it to 4.

## Also fork-specific

- Azure-dependent VRT comparison and website deploy remain upstream-only (fork lacks credentials);
  no upstream change needed there.
- The `TypeScript benchmark` workflow and pinned `benchmark/typescript-6-base` base exist only for
  the fork's 5.7.3-vs-6.0.3 comparison and should not be part of the upstream PR.

## Split the code diff, too

For a reviewable upstream PR, split into: (a) compiler + tsconfig upgrade (the resolver split,
inline helpers, peer ranges), (b) the Cypress `.ts -> .js` conversion, (c) the dts-rollup /
api-extractor rework, (d) the source-contract fixes (entry-point imports, `RefAttributes`).
