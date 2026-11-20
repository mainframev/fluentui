'use client';

import * as React from 'react';
import { useFluent_unstable } from '@fluentui/react-shared-contexts';
import {
  isHTMLElement,
  useAnimationFrame,
  useEventCallback,
  useIsomorphicLayoutEffect,
} from '@fluentui/react-utilities';
import type { ListNavigationMode } from './List.types';

const authorTabIndices = new WeakMap<HTMLElement, { attribute: string | null; tabIndex: number }>();
const editableOrMediaSelector =
  '[contenteditable=""], [contenteditable="true" i], [contenteditable="plaintext-only" i], audio[controls], video[controls]';
const naturallyFocusableSelector = `a[href], area[href], button, input, select, textarea, iframe, object, embed, summary, ${editableOrMediaSelector}`;

const getAuthorTabIndex = (element: HTMLElement): number =>
  !element.hasAttribute('tabindex') && element.matches(editableOrMediaSelector) ? 0 : element.tabIndex;

const updateAuthorTabIndices = (root: HTMLElement, records: MutationRecord[]): void => {
  for (const record of records) {
    if (
      isHTMLElement(record.target) &&
      record.target.closest('[data-list]') === root &&
      authorTabIndices.has(record.target)
    ) {
      if (record.attributeName === 'tabindex') {
        authorTabIndices.set(record.target, {
          attribute: record.target.getAttribute('tabindex'),
          tabIndex: getAuthorTabIndex(record.target),
        });
      } else if (['contenteditable', 'controls', 'href', 'type'].includes(record.attributeName ?? '')) {
        const original = authorTabIndices.get(record.target);
        if (original?.attribute === null) {
          original.tabIndex = record.target.matches(naturallyFocusableSelector) ? 0 : -1;
        }
      }
    }
  }
};

type CheckVisibility = (options?: { visibilityProperty?: boolean; checkVisibilityCSS?: boolean }) => boolean;

const nativeVisible = (element: HTMLElement): boolean | undefined => {
  const check = (element as HTMLElement & { checkVisibility?: CheckVisibility }).checkVisibility;
  return typeof check === 'function'
    ? check.call(element, { visibilityProperty: true, checkVisibilityCSS: true })
    : undefined;
};

/**
 * @param rootVisible - whether the native visibility check is known to be valid for `boundary`.
 * `checkVisibility()` also inspects ancestors above the list, so it is only equivalent to walking up to
 * the boundary when the boundary itself is visible.
 */
const isAvailableWithin = (element: HTMLElement, boundary: HTMLElement, rootVisible: boolean): boolean => {
  if (element.matches(':disabled, input[type="hidden"]') || element.closest('[hidden], [inert]')) {
    return false;
  }
  if (rootVisible) {
    return nativeVisible(element) === true;
  }
  const view = element.ownerDocument.defaultView;
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const style = view?.getComputedStyle(current);
    if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') {
      return false;
    }
    if (current === boundary) {
      break;
    }
  }
  return true;
};

const isAvailable = (element: HTMLElement, boundary: HTMLElement): boolean =>
  isAvailableWithin(element, boundary, nativeVisible(boundary) === true);

const getFocusableElements = (root: HTMLElement, boundary: HTMLElement, rootVisible: boolean): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(`[tabindex], ${naturallyFocusableSelector}`)).filter(
    element =>
      (authorTabIndices.get(element)?.tabIndex ?? getAuthorTabIndex(element)) >= 0 &&
      isAvailableWithin(element, boundary, rootVisible),
  );

export const getListFocusableElements = (root: HTMLElement): HTMLElement[] =>
  getFocusableElements(root, root, nativeVisible(root) === true);

/** Rows of `list` that are candidates for vertical navigation, in DOM order. Availability is NOT checked. */
export const getListRows = (list: HTMLElement): HTMLElement[] =>
  Array.from(list.querySelectorAll<HTMLElement>('[data-navigable]')).filter(
    row => row.closest('[data-list]') === list && (authorTabIndices.get(row)?.tabIndex ?? getAuthorTabIndex(row)) >= 0,
  );

export const isListElementAvailable = isAvailable;

/**
 * Composite grids need a roving tab stop until focusgroup supports their row/control model.
 * Keep author tabindex values separate so explicit opt-outs survive focus movement and cleanup.
 */
export const useCompositeListNavigation = (
  navigationMode: ListNavigationMode | undefined,
  rootRef: React.RefObject<HTMLElement | null>,
): React.FocusEventHandler<HTMLElement> => {
  const { targetDocument } = useFluent_unstable();
  const current = React.useRef<HTMLElement | null>(null);
  const managed = React.useRef(new Set<HTMLElement>());
  const observer = React.useRef<MutationObserver | undefined>(undefined);
  const pendingRecords = React.useRef<MutationRecord[]>([]);
  const [requestFrame, cancelFrame] = useAnimationFrame();

  const reconcile = useEventCallback(() => {
    const root = rootRef.current;
    if (!root || navigationMode !== 'composite') {
      return;
    }
    cancelFrame();
    updateAuthorTabIndices(root, [...pendingRecords.current.splice(0), ...(observer.current?.takeRecords() ?? [])]);

    const rootVisible = nativeVisible(root) === true;
    const rows = getListRows(root).filter(element => isAvailableWithin(element, root, rootVisible));
    const elements = rows.flatMap(row => [
      row,
      ...getFocusableElements(row, root, rootVisible).filter(
        element => element.closest('[data-navigable]') === row && element.closest('[data-list]') === root,
      ),
    ]);
    const nextManaged = new Set(elements);

    for (const element of managed.current) {
      if (!nextManaged.has(element)) {
        const original = authorTabIndices.get(element);
        if (original?.attribute === null) {
          element.removeAttribute('tabindex');
        } else if (original) {
          element.setAttribute('tabindex', original.attribute);
        }
        authorTabIndices.delete(element);
      }
    }

    if (!current.current || !nextManaged.has(current.current)) {
      current.current = rows[0] ?? null;
    }
    for (const element of elements) {
      if (!authorTabIndices.has(element)) {
        authorTabIndices.set(element, {
          attribute: element.getAttribute('tabindex'),
          tabIndex: getAuthorTabIndex(element),
        });
      }
      const tabIndex = element === current.current ? 0 : -1;
      // Natural editables/media can report -1 while still being native tab stops.
      if (element.getAttribute('tabindex') !== String(tabIndex)) {
        element.tabIndex = tabIndex;
      }
    }
    managed.current = nextManaged;
    observer.current?.takeRecords();
  });

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (navigationMode !== 'composite' || !root) {
      return;
    }
    const MutationObserver = targetDocument?.defaultView?.MutationObserver;
    if (MutationObserver) {
      observer.current = new MutationObserver(records => {
        pendingRecords.current.push(...records);
        requestFrame(() => reconcile());
      });
      observer.current.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'tabindex',
          'disabled',
          'hidden',
          'inert',
          'href',
          'type',
          'contenteditable',
          'controls',
          'style',
          'class',
        ],
      });
    }
    reconcile();

    return () => {
      updateAuthorTabIndices(root, [...pendingRecords.current.splice(0), ...(observer.current?.takeRecords() ?? [])]);
      observer.current?.disconnect();
      observer.current = undefined;
      cancelFrame();
      pendingRecords.current = [];
      for (const element of managed.current) {
        const original = authorTabIndices.get(element);
        if (original?.attribute === null) {
          element.removeAttribute('tabindex');
        } else if (original) {
          element.setAttribute('tabindex', original.attribute);
        }
        authorTabIndices.delete(element);
      }
      managed.current.clear();
      current.current = null;
    };
  }, [cancelFrame, navigationMode, reconcile, requestFrame, rootRef, targetDocument]);

  return useEventCallback(event => {
    const root = rootRef.current;
    if (navigationMode !== 'composite' || !root || !isHTMLElement(event.target)) {
      return;
    }
    const row = event.target.closest<HTMLElement>('[data-navigable]');
    if (row?.closest('[data-list]') === root) {
      const next = managed.current.has(event.target) ? event.target : row;
      // Undelivered mutation records mean the managed set may be stale, so only take the fast path when none exist.
      pendingRecords.current.push(...(observer.current?.takeRecords() ?? []));
      if (managed.current.has(next) && !pendingRecords.current.length) {
        const previous = current.current;
        current.current = next;
        if (previous && previous !== next && managed.current.has(previous)) {
          previous.tabIndex = -1;
        }
        if (next.getAttribute('tabindex') !== '0') {
          next.tabIndex = 0;
        }
        // Discard the records produced by our own tabindex writes so they are not mistaken for author changes.
        observer.current?.takeRecords();
        return;
      }
      current.current = next;
      reconcile();
    }
  });
};
