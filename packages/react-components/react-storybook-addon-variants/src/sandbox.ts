import type { SandboxContext } from '@fluentui/react-storybook-addon-export-to-sandbox';

import type { VariantConfig, VariantFile, VariantsParameter } from './public-types';
import { getSelection } from './variant-store';

/**
 * Snapshot of the variant that is currently selected in the docs UI for the
 * story whose sandbox is being built. Returned by `getActiveVariant(ctx)` for
 * use inside `parameters.exportToSandbox.transformFiles` callbacks.
 */
export interface ActiveVariant {
  /** Variant key (e.g. `tailwind`, `css`). */
  key: string;
  /** The variant's full config from `parameters.variants[key]`. */
  config: VariantConfig;
  /** Variant's files (from `config.files`). */
  files: VariantFile[];
  /** The file currently chosen in the picker (or the first file). */
  activeFile?: VariantFile;
}

/**
 * Read the active variant for the story whose sandbox is being built. Use it
 * inside a `parameters.exportToSandbox.transformFiles` callback to branch on
 * which tab the user has selected at click time.
 *
 * Returns `undefined` if the story has no `parameters.variants` declaration —
 * in which case the caller should fall through to the addon's default
 * behaviour.
 *
 * @example
 * exportToSandbox: {
 *   transformFiles: (files, ctx) => {
 *     const active = getActiveVariant(ctx);
 *     if (!active) return files;
 *     // overlay active.files onto `files`, branch on active.key, etc.
 *   }
 * }
 */
export function getActiveVariant(ctx: SandboxContext): ActiveVariant | undefined {
  const params = ctx.storyParameters?.variants as VariantsParameter | undefined;
  if (!params) return undefined;
  const selection = getSelection(ctx.storyId, params);
  const config = params[selection.variant];
  if (!config) return undefined;
  const activeFile = config.files.find(f => f.name === selection.file) ?? config.files[0];
  return { key: selection.variant, config, files: config.files, activeFile };
}
