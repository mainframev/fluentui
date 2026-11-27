'use client';

import * as React from 'react';
import { useRatingBase_unstable } from '@fluentui/react-rating';

import { RatingItem } from './RatingItem';
import type { RatingProps, RatingState } from './Rating.types';

/**
 * Returns the state for a Rating component, given its props and ref.
 * Renders `max` rating items (default 5) when no children are passed.
 */
export const useRating = (props: RatingProps, ref: React.Ref<HTMLDivElement>): RatingState => {
  const { max = 5, ...baseProps } = props;
  const state = useRatingBase_unstable(baseProps, ref);

  // Memoized so the items keep their identity across re-renders.
  const rootChildren = React.useMemo(
    () => Array.from(Array(max), (_, i) => <RatingItem value={i + 1} key={i + 1} />),
    [max],
  );

  // eslint-disable-next-line react-hooks/immutability
  state.root.children ??= rootChildren;

  return state;
};
