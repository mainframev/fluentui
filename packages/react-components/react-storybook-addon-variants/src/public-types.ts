import type * as React from 'react';

/**
 * A single source file shown under a variant. The `name` is the label used in
 * the file dropdown; the first file in a variant's `files` array is the one
 * shown by default when that variant is selected.
 */
export interface VariantFile {
  /** Filename as shown in the dropdown and used for syntax highlighting when `language` is omitted. */
  name: string;
  /** Raw file contents. */
  source: string;
  /** Optional language hint for the syntax highlighter. Inferred from `name` if omitted. */
  language?: string;
}

/**
 * Configuration for a single variant (e.g. `tailwind` or `css`).
 */
export interface VariantConfig {
  /** Human-readable label shown on the tab (e.g. "Tailwind", "CSS"). Defaults to the key. */
  label?: string;
  /** React component rendered when this variant is active. If omitted, the default story function runs. */
  component?: React.ComponentType;
  /** One or more source files for this variant. First entry is the default. */
  files: VariantFile[];
}

/**
 * `parameters.variants` shape. Keys are variant IDs (e.g. `tailwind`, `css`).
 * The first key in the object is the default variant for a story.
 */
export type VariantsParameter = Record<string, VariantConfig>;

/**
 * Augment this into Storybook's Parameters to get per-story typing:
 *
 * ```ts
 * import type { Parameters } from '@fluentui/react-storybook-addon-variants';
 *
 * Default.parameters = {
 *   variants: { tailwind: { files: [...] }, css: { files: [...], component: DefaultCss } }
 * } satisfies Parameters;
 * ```
 */
export interface ParametersExtension {
  variants?: VariantsParameter;
}
