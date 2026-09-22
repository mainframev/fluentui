export const palette =
  '[--docs-bg:var(--docs-bg-light)] [--docs-fg:var(--docs-fg-light)] [--docs-border:var(--docs-border-light)] [--docs-muted:var(--docs-muted-light)] dark:[--docs-bg:var(--docs-bg-dark)] dark:[--docs-fg:var(--docs-fg-dark)] dark:[--docs-border:var(--docs-border-dark)] dark:[--docs-muted:var(--docs-muted-dark)]';
const focus =
  'focus-visible:outline focus-visible:outline-[length:var(--docs-focus)] focus-visible:outline-offset-[var(--docs-focus)] focus-visible:outline-[var(--docs-fg)]';
export const field = `min-h-docs-height min-w-0 rounded-docs border border-docs-border bg-docs-bg px-docs-x py-docs-y text-docs text-docs-fg hover:border-docs-fg disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;

export const toggleRoot = `${palette} group relative inline-flex min-h-docs-height items-center gap-docs-gap data-disabled:cursor-not-allowed data-disabled:opacity-50`;
export const toggleInput =
  'peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed';
export const toggleIndicator =
  'pointer-events-none relative inline-flex h-docs-indicator shrink-0 items-center justify-center border border-docs-muted bg-docs-bg text-docs-bg peer-focus-visible:outline peer-focus-visible:outline-[length:var(--docs-focus)] peer-focus-visible:outline-offset-[var(--docs-focus)] peer-focus-visible:outline-docs-fg group-hover:border-docs-fg group-data-checked:bg-docs-fg group-data-checked:border-docs-fg';
