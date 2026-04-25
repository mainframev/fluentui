import type { VariantsParameter } from './public-types';
import type { VariantState } from './types';

type Listener = () => void;

/**
 * Per-story variant selection. Lives outside Storybook's globals so that tab
 * clicks do not trigger `updateGlobals` → docs story re-prepare → React
 * unmount, which is the root cause of the canvas flicker we saw with the
 * globals-driven design.
 */
const selections = new Map<string, VariantState>();
const listeners = new Map<string, Set<Listener>>();

const expansions = new Map<string, boolean>();
const expansionListeners = new Map<string, Set<Listener>>();

export function computeDefaultSelection(params: VariantsParameter): VariantState {
  const variant = Object.keys(params)[0];
  const file = params[variant]?.files[0]?.name;
  return { variant, file };
}

export function getSelection(storyId: string, params: VariantsParameter): VariantState {
  let s = selections.get(storyId);
  if (!s) {
    s = computeDefaultSelection(params);
    selections.set(storyId, s);
  }
  return s;
}

export function setSelection(storyId: string, next: VariantState): void {
  const prev = selections.get(storyId);
  if (prev && prev.variant === next.variant && prev.file === next.file) return;
  selections.set(storyId, next);
  listeners.get(storyId)?.forEach(l => l());
}

export function subscribe(storyId: string, l: Listener): () => void {
  let set = listeners.get(storyId);
  if (!set) {
    set = new Set();
    listeners.set(storyId, set);
  }
  set.add(l);
  return () => {
    set!.delete(l);
  };
}

export function getExpansion(storyId: string): boolean {
  return expansions.get(storyId) ?? false;
}

export function setExpansion(storyId: string, next: boolean): void {
  if (getExpansion(storyId) === next) return;
  expansions.set(storyId, next);
  expansionListeners.get(storyId)?.forEach(l => l());
}

export function subscribeExpansion(storyId: string, l: Listener): () => void {
  let set = expansionListeners.get(storyId);
  if (!set) {
    set = new Set();
    expansionListeners.set(storyId, set);
  }
  set.add(l);
  return () => {
    set!.delete(l);
  };
}
