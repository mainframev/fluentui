import * as React from 'react';
import { BaseFloatingSuggestions } from '../FloatingSuggestions';
import { SuggestionItemNormal } from './FloatingPeopleSuggestionItems/SuggestionItemDefault';
import type { IFloatingPeopleSuggestionsProps } from './FloatingPeopleSuggestions.types';
import type { IPersonaProps } from '@fluentui/react/lib/Persona';
import type { IFloatingSuggestionOnRenderItemProps } from '../FloatingSuggestionsItem/FloatingSuggestionsItem.types';

// eslint-disable-next-line @typescript-eslint/no-deprecated
export const FloatingPeopleSuggestions = (props: IFloatingPeopleSuggestionsProps): JSX.Element => {
  const renderSuggestionItem = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    (suggestionItemProps: IFloatingSuggestionOnRenderItemProps<IPersonaProps>): JSX.Element => {
      return SuggestionItemNormal({ ...suggestionItemProps.item });
    },
    [],
  );

  return (
    <>
      <BaseFloatingSuggestions
        {...props}
        onRenderSuggestion={props.onRenderSuggestion ? props.onRenderSuggestion : renderSuggestionItem}
      />
    </>
  );
};
