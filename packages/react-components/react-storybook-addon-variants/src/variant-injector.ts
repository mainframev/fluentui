import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type { VariantConfig, VariantsParameter } from './public-types';
import { SourceBlock } from './source-block';
import type { StoryContext, VariantState } from './types';
import { getDefaultFileName } from './variant-state';
import { getExpansion, getSelection, setExpansion, setSelection, subscribe } from './variant-store';

const MARKER_CLASS = 'sb-variants-bar';
const TAB_CLASS = 'sb-variants-tab';
const ACTIVE_CLASS = 'sb-variants-tab--active';
const SELECT_CLASS = 'sb-variants-file-select';
const PICKER_CLASS = 'sb-variants-file-picker';
const UNSUB_KEY = '__sbVariantsUnsubscribe';

type BarWithUnsub = HTMLElement & { [UNSUB_KEY]?: () => void };

/**
 * Mount (or update) the variant toolbar above the rendered story inside
 * `.innerZoomElementWrapper`. Runs in docs mode only; Storybook provides the
 * story in an isolated React root, so we inject plain DOM elements.
 *
 * The bar is reused across re-renders to avoid layout shift: on subsequent
 * calls we just update the active class and the dropdown options instead of
 * tearing the element down and rebuilding it.
 */
export function injectVariantBar(context: StoryContext): void {
  const params = context.parameters?.variants;
  if (!params) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const wrappers = findWrappers(context.id);
      wrappers.forEach(wrapper => reconcileBar(wrapper, context, params));
      const previews = findPreviews(context.id);
      previews.forEach(preview => {
        attachAutoToggleHook(preview, context.id);
        mountSourceOutlet(preview, context.id, params);
        reconcilePicker(preview, context, params);
      });
    });
  });
}

function findWrappers(storyId: string): HTMLElement[] {
  const selector = `#anchor--${storyId} .innerZoomElementWrapper, #anchor--primary--${storyId} .innerZoomElementWrapper`;
  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

function findPreviews(storyId: string): HTMLElement[] {
  const selector = `#anchor--${storyId} .sbdocs-preview, #anchor--primary--${storyId} .sbdocs-preview`;
  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

const TOGGLE_CLASS = 'docblock-code-toggle';
const SANDBOX_TOGGLE_CLASS = 'with-code-sandbox-button';
const HOOKED_KEY = '__sbVariantsToggleHooked';

type ElWithFlag = HTMLElement & { [HOOKED_KEY]?: true };

/**
 * Mirror clicks on Storybook's auto "Show code" button into the variant
 * store's expansion flag. We listen for clicks anywhere inside the preview
 * (event delegation) and only react when the click hits the *Show code* —
 * not the StackBlitz "Open in Sandbox" sibling that shares the
 * `.docblock-code-toggle` class.
 *
 * We use a click listener rather than a `MutationObserver` on
 * `.docblock-code-toggle--expanded` because the auto Source block's own React
 * tree resets that class mid-render when our `<SyntaxHighlighter>` causes a
 * sibling subtree to update — leading to a flicker between expanded/collapsed
 * in the store. A pure click handler is decoupled from addon-docs's internal
 * state and only flips on real user intent.
 */
const OUTLET_CLASS = 'sb-variants-source-outlet';
const ROOT_KEY = '__sbVariantsSourceRoot';

type OutletWithRoot = HTMLElement & { [ROOT_KEY]?: Root };

/**
 * Mount the controlled `<SourceBlock>` into a sibling of `.sbdocs-preview`,
 * directly below the canvas (and the auto Show code / StackBlitz button row).
 * Rendering it outside the per-story canvas root keeps the source code from
 * showing inside the preview chrome — and lets it span the docs page width
 * the same way Storybook's auto Source panel would.
 *
 * The outlet uses its own React root so the canvas and source render trees
 * are independent — variant-store updates re-render the canvas slots and the
 * source block separately, without either ever forcing the other to remount.
 */
function mountSourceOutlet(preview: HTMLElement, storyId: string, params: VariantsParameter): void {
  const parent = preview.parentElement;
  if (!parent) return;
  let outlet = parent.querySelector<OutletWithRoot>(`:scope > .${OUTLET_CLASS}[data-storyid="${storyId}"]`);
  if (!outlet) {
    outlet = document.createElement('div') as OutletWithRoot;
    outlet.className = OUTLET_CLASS;
    outlet.setAttribute('data-storyid', storyId);
    preview.insertAdjacentElement('afterend', outlet);
  }
  if (!outlet[ROOT_KEY]) {
    outlet[ROOT_KEY] = createRoot(outlet);
  }
  outlet[ROOT_KEY].render(React.createElement(SourceBlock, { storyId, params }));
}

function attachAutoToggleHook(preview: HTMLElement, storyId: string): void {
  const tagged = preview as ElWithFlag;
  if (tagged[HOOKED_KEY]) return;
  tagged[HOOKED_KEY] = true;

  preview.addEventListener('click', evt => {
    const target = evt.target as HTMLElement | null;
    if (!target) return;
    const toggle = target.closest<HTMLElement>(`.${TOGGLE_CLASS}`);
    if (!toggle || toggle.classList.contains(SANDBOX_TOGGLE_CLASS)) return;
    setExpansion(storyId, !getExpansion(storyId));
  });
}

function reconcileBar(wrapper: HTMLElement, context: StoryContext, params: VariantsParameter): void {
  const selection = getSelection(context.id, params);
  let bar = wrapper.querySelector<BarWithUnsub>(`:scope > .${MARKER_CLASS}`);
  if (!bar) {
    bar = document.createElement('div') as BarWithUnsub;
    bar.className = MARKER_CLASS;
    bar.setAttribute('role', 'toolbar');
    const tabs = buildTabGroup(context, params);
    bar.appendChild(tabs);
    wrapper.prepend(bar);
  } else {
    syncTabActiveState(bar, selection);
  }

  // Re-subscribe on every reconcile so the closure captures the freshest
  // `params` reference. Tabs only — the file picker has moved to the auto
  // button row and manages its own subscription per preview.
  bar[UNSUB_KEY]?.();
  bar[UNSUB_KEY] = subscribe(context.id, () => {
    syncTabActiveState(bar!, getSelection(context.id, params));
  });
}

const PICKER_UNSUB_KEY = '__sbVariantsPickerUnsubscribe';

type PreviewWithPickerUnsub = HTMLElement & { [PICKER_UNSUB_KEY]?: () => void };

/**
 * Mount the file picker (when the active variant has multiple files) into
 * the auto button row that hosts Show code + StackBlitz, so it sits at the
 * same visual level as those buttons. Done by walking up from the auto Show
 * code button to its parent — that's the row container in every Storybook
 * 9 docs layout we care about, and avoids hard-coding emotion class names.
 */
function reconcilePicker(preview: HTMLElement, context: StoryContext, params: VariantsParameter): void {
  const showCode = preview.querySelector<HTMLElement>(`.${TOGGLE_CLASS}:not(.${SANDBOX_TOGGLE_CLASS})`);
  const buttonRow = showCode?.parentElement;
  if (!buttonRow) return;

  // Tag the row so CSS can expand it to full canvas width with
  // `justify-content: space-between`. Storybook's default auto-width
  // emotion class shrinks the row to fit the buttons (~460px) — we want
  // it to span the canvas so the picker anchors to the left edge.
  buttonRow.classList.add(BUTTON_ROW_CLASS);

  const sync = () => syncFileDropdown(buttonRow, context, params, getSelection(context.id, params));
  sync();

  const tagged = preview as PreviewWithPickerUnsub;
  tagged[PICKER_UNSUB_KEY]?.();
  tagged[PICKER_UNSUB_KEY] = subscribe(context.id, sync);
}

const BUTTON_ROW_CLASS = 'sb-variants-button-row';

function buildTabGroup(context: StoryContext, params: VariantsParameter): HTMLElement {
  const group = document.createElement('div');
  group.className = 'sb-variants-tabs';
  group.setAttribute('role', 'tablist');
  group.setAttribute('aria-label', 'Code variant');

  const selection = getSelection(context.id, params);

  for (const [key, config] of Object.entries(params)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.dataset.variant = key;
    button.textContent = config.label ?? key;
    button.className = TAB_CLASS;
    if (selection.variant === key) {
      button.classList.add(ACTIVE_CLASS);
      button.setAttribute('aria-selected', 'true');
    } else {
      button.setAttribute('aria-selected', 'false');
    }
    button.addEventListener('click', () => {
      const current = getSelection(context.id, params);
      if (current.variant === key) return;
      const next: VariantState = {
        variant: key,
        file: getDefaultFileName(params[key]),
      };
      setSelection(context.id, next);
    });
    group.appendChild(button);
  }

  return group;
}

function syncTabActiveState(bar: HTMLElement, selection: VariantState): void {
  bar.querySelectorAll<HTMLButtonElement>(`.${TAB_CLASS}`).forEach(btn => {
    const variant = btn.dataset.variant;
    const isActive = variant === selection.variant;
    btn.classList.toggle(ACTIVE_CLASS, isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function syncFileDropdown(
  host: HTMLElement,
  context: StoryContext,
  params: VariantsParameter,
  selection: VariantState,
): void {
  const activeConfig = params[selection.variant];
  const needsPicker = !!activeConfig && activeConfig.files.length > 1;
  let picker = host.querySelector<HTMLElement>(`:scope > .${PICKER_CLASS}`);

  if (!needsPicker) {
    picker?.remove();
    return;
  }

  if (!picker) {
    picker = buildFileDropdown(context, params);
    // Insert *before* the existing buttons so the picker reads left-to-right
    // as: [File ▾] [Open in Sandbox] [Show code]. Falls back to append if
    // there are no children for some reason.
    if (host.firstChild) {
      host.insertBefore(picker, host.firstChild);
    } else {
      host.appendChild(picker);
    }
  }

  const select = picker.querySelector<HTMLSelectElement>(`.${SELECT_CLASS}`);
  if (!select || !activeConfig) return;

  const desiredNames = activeConfig.files.map((f: { name: string }) => f.name);
  const currentNames = Array.from(select.options).map(o => o.value);
  const mismatch = desiredNames.length !== currentNames.length || desiredNames.some((n, i) => n !== currentNames[i]);

  if (mismatch) {
    select.innerHTML = '';
    for (const file of activeConfig.files) {
      const option = document.createElement('option');
      option.value = file.name;
      option.textContent = file.name;
      select.appendChild(option);
    }
  }

  if (select.value !== selection.file && selection.file) {
    select.value = selection.file;
  }
}

function buildFileDropdown(context: StoryContext, params: VariantsParameter): HTMLElement {
  const wrapper = document.createElement('label');
  wrapper.className = PICKER_CLASS;

  const srLabel = document.createElement('span');
  srLabel.className = 'sb-variants-visually-hidden';
  srLabel.textContent = 'File';
  wrapper.appendChild(srLabel);

  const select = document.createElement('select');
  select.className = SELECT_CLASS;
  select.addEventListener('change', () => {
    const current = getSelection(context.id, params);
    setSelection(context.id, { variant: current.variant, file: select.value });
  });
  wrapper.appendChild(select);
  return wrapper;
}

// Re-export VariantConfig only to keep the original module's surface type
// stable for any downstream tooling that imported from here.
export type { VariantConfig };
