import type { Root } from 'fumadocs-core/page-tree';
import { groupSiblings } from './groupSiblings';

/** Share indexed folders between the sidebar, breadcrumbs, and section overviews. */
export function createDocsTree(tree: Root): Root {
  return { ...tree, children: groupSiblings(tree.children) };
}
