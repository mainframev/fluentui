import * as React from 'react';
import { useArgs } from 'storybook/preview-api';
import { readStoredVariant, storeVariant, STYLE_VARIANT_ARG, type StyleVariant } from './StyleVariantContext';

const WRAPPER_CLASS = 'with-style-variant-wrapper';
const BUTTON_CLASS = 'with-style-variant-button';

const findContainers = (storyId: string): HTMLElement[] => {
  const docsSelector = `#anchor--${storyId} .docs-story, #anchor--primary--${storyId} .docs-story`;
  const rootElements = document.querySelectorAll<HTMLElement>(docsSelector);
  const results: HTMLElement[] = [];
  rootElements.forEach(rootElement => {
    const showCodeButton = rootElement.querySelector('.docblock-code-toggle');
    const container = showCodeButton?.parentElement;
    if (container) results.push(container);
  });
  return results;
};

const renderButtons = (container: HTMLElement, current: StyleVariant, onPick: (next: StyleVariant) => void) => {
  container.querySelectorAll(`.${WRAPPER_CLASS}`).forEach(n => n.remove());

  const wrapper = document.createElement('div');
  wrapper.className = WRAPPER_CLASS;

  const make = (variant: StyleVariant, label: string) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = BUTTON_CLASS;
    btn.setAttribute('data-variant', variant);
    btn.setAttribute('aria-pressed', String(variant === current));
    if (variant === current) btn.classList.add(`${BUTTON_CLASS}--active`);
    btn.addEventListener('click', () => onPick(variant));
    return btn;
  };

  wrapper.appendChild(make('tailwind', 'Tailwind'));
  wrapper.appendChild(make('css', 'CSS'));
  container.prepend(wrapper);
};

const StyleVariantButtonsWrapper: React.FC<{
  StoryFn: React.ComponentType;
  context: Record<string, any>;
}> = ({ StoryFn, context }) => {
  const [args, updateArgs] = useArgs();
  const enabled = context.viewMode === 'docs' && !!context.parameters?.headlessVariants;
  const variant: StyleVariant = (args?.[STYLE_VARIANT_ARG] as StyleVariant | undefined) ?? readStoredVariant();
  const storyId = context.id as string;

  const onPick = React.useCallback(
    (next: StyleVariant) => {
      if (next === variant) return;
      storeVariant(next);
      updateArgs({ [STYLE_VARIANT_ARG]: next });
    },
    [variant, updateArgs],
  );

  React.useEffect(() => {
    if (!enabled) return undefined;
    let canceled = false;
    let raf2: number | undefined;
    const raf1 = requestAnimationFrame(() => {
      if (canceled) return;
      raf2 = requestAnimationFrame(() => {
        if (canceled) return;
        findContainers(storyId).forEach(container => renderButtons(container, variant, onPick));
      });
    });
    return () => {
      canceled = true;
      cancelAnimationFrame(raf1);
      if (raf2 !== undefined) cancelAnimationFrame(raf2);
    };
  }, [storyId, variant, enabled, onPick]);

  React.useEffect(
    () => () => {
      if (!enabled) return;
      findContainers(storyId).forEach(container => {
        container.querySelectorAll(`.${WRAPPER_CLASS}`).forEach(n => n.remove());
      });
    },
    [storyId, enabled],
  );

  return <StoryFn />;
};

export const withStyleVariantButtons = (StoryFn: React.ComponentType, context: Record<string, any>) => (
  <StyleVariantButtonsWrapper StoryFn={StoryFn} context={context} />
);
