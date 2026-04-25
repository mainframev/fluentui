import type { StoryContext as StorybookStoryContext } from 'storybook/internal/csf';
import type { ParametersExtension } from './public-types';

export type VariantState = {
  /** Active variant key (e.g. `tailwind`, `css`). */
  variant: string;
  /** Active file name within the variant. */
  file?: string;
};

export type StoryContext = StorybookStoryContext & {
  parameters: StorybookStoryContext['parameters'] & ParametersExtension;
};
