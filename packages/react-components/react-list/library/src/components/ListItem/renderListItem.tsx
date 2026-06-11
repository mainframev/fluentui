/** @jsxRuntime automatic */
/** @jsxImportSource @fluentui/react-jsx-runtime */

import { assertSlots } from '@fluentui/react-utilities';
import type { JSXElement } from '@fluentui/react-utilities';
import type { ListItemBaseState, ListItemSlots } from './ListItem.types';

/**
 * Render the final JSX of ListItem
 */
export const renderListItem_unstable = (state: ListItemBaseState): JSXElement => {
  assertSlots<ListItemSlots>(state);

  return (
    <state.root>
      {state.checkmark && <state.checkmark />}
      {state.root.children}
    </state.root>
  );
};
