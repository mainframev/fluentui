import { useFluent_unstable as useFluent } from '@fluentui/react-shared-contexts';
import { getIntrinsicElementProps, slot, useEventCallback, useMergedRefs } from '@fluentui/react-utilities';
import * as React from 'react';

import type { CarouselProps, CarouselState } from './Carousel.types';
import type { CarouselContextValue } from '../CarouselContext.types';
import { useEmblaCarousel } from '../useEmblaCarousel';

/**
 * Create the state required to render Carousel.
 *
 * The returned state can be modified with hooks such as useCarouselStyles_unstable,
 * before being passed to renderCarousel_unstable.
 *
 * @param props - props from this instance of Carousel
 * @param ref - reference to root HTMLDivElement of Carousel
 */
export function useCarousel_unstable(props: CarouselProps, ref: React.Ref<HTMLDivElement>): CarouselState {
  'use no memo';

  const {
    align = 'center',
    circular = false,
    onActiveIndexChange,
    groupSize = 'auto',
    draggable = false,
    whitespace = false,
  } = props;

  const { dir } = useFluent();
  const { activeIndex, carouselApi, containerRef, subscribeForValues, enableAutoplay } = useEmblaCarousel({
    align,
    direction: dir,
    loop: circular,
    slidesToScroll: groupSize,
    defaultActiveIndex: props.defaultActiveIndex,
    activeIndex: props.activeIndex,
    watchDrag: draggable,
    containScroll: whitespace ? false : 'keepSnaps',
  });

  const selectPageByElement: CarouselContextValue['selectPageByElement'] = useEventCallback((event, element, jump) => {
    const foundIndex = carouselApi.scrollToElement(element, jump);
    onActiveIndexChange?.(event, { event, type: 'focus', index: foundIndex });

    return foundIndex;
  });

  const selectPageByIndex: CarouselContextValue['selectPageByIndex'] = useEventCallback((event, index, jump) => {
    carouselApi.scrollToIndex(index, jump);

    onActiveIndexChange?.(event, { event, type: 'click', index });
  });

  const selectPageByDirection: CarouselContextValue['selectPageByDirection'] = useEventCallback((event, direction) => {
    const nextPageIndex = carouselApi.scrollInDirection(direction);
    onActiveIndexChange?.(event, { event, type: 'click', index: nextPageIndex });

    return nextPageIndex;
  });

  const mergedRefs = useMergedRefs(ref, containerRef);

  return {
    components: {
      root: 'div',
    },
    root: slot.always(
      getIntrinsicElementProps('div', {
        ref: mergedRefs,
        role: 'region',
        ...props,
      }),
      { elementType: 'div' },
    ),

    activeIndex,
    circular,
    containerRef: mergedRefs,
    selectPageByElement,
    selectPageByDirection,
    selectPageByIndex,
    subscribeForValues,
    enableAutoplay,
  };
}
