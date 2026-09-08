import { useGlobals as useStorybookGlobals } from 'storybook/manager-api';
import type { Args as StorybookArgs, StoryContext as StorybookContext, Parameters } from '@storybook/react-webpack5';

import type { DIR_ID, STRICT_MODE_ID, THEME_ID, THEMES } from './constants';
import type { Theme, ThemeIds } from './theme';

/** A DOM data attribute name. */
export type DataAttributeName = `data-${string}`;

/** Maps slot names and property names to public data attribute names. */
export type DataAttributes = Readonly<Record<string, Readonly<Record<string, DataAttributeName>>>>;

/** Describes the values accepted by a data attribute. */
export type DataAttributeValue = readonly string[] | string;

/** Optional value metadata keyed like a data attribute map. Omitted entries are boolean attributes. */
export type DataAttributeValues = Readonly<Record<string, Readonly<Record<string, DataAttributeValue>>>>;

/** Data attribute documentation for one component. */
export type ComponentDataAttributes = {
  attributes: DataAttributes;
  values?: DataAttributeValues;
};

/** Data attribute documentation for one component or a component family. */
export type DataAttributeDocs =
  | ComponentDataAttributes
  | { components: Readonly<Record<string, ComponentDataAttributes>> };

export interface FluentStoryContext extends StorybookContext {
  globals: FluentGlobals;
  parameters: FluentParameters;
}

/**
 * Extends the storybook globals object to include fluent specific properties
 */
export interface FluentGlobals extends StorybookArgs {
  [DIR_ID]?: 'ltr' | 'rtl';
  [THEME_ID]?: ThemeIds;
  [THEMES]?: Theme[];
  [STRICT_MODE_ID]?: boolean;
}

/**
 * Extends the storybook parameters object to include fluent specific properties
 */
export interface FluentParameters extends Parameters {
  dir?: 'ltr' | 'rtl';
  fluentTheme?: ThemeIds;
  fluentThemes?: Theme[];
  mode?: 'default' | 'vr-test';
  reactStorybookAddon?: {
    disabledDecorators?: ['AriaLive' | 'FluentProvider' | 'ReactStrictMode'];
    docs?: FluentDocsConfig;
  };
}

/**
 * Configuration for docs components
 */
export type FluentDocsConfig =
  | boolean
  | {
      tableOfContents?: boolean;
      dirSwitcher?: boolean;
      themePicker?: boolean;
      copyAsMarkdown?: boolean;
      /** Public data attribute names rendered by the component or component family. */
      dataAttributes?: DataAttributeDocs;
      argTable?:
        | boolean
        | {
            slotsApi?: boolean;
            nativePropsApi?: boolean;
          };
    };

export function useGlobals(): [FluentGlobals, (newGlobals: FluentGlobals) => void, FluentGlobals, FluentGlobals] {
  return useStorybookGlobals();
}

export function parameters(options?: FluentParameters): FluentParameters {
  return { dir: 'ltr', fluentTheme: 'web-light', mode: 'default', ...options };
}
export function getParametersConfig(context: FluentStoryContext): FluentParameters['reactStorybookAddon'] {
  return context?.parameters?.reactStorybookAddon;
}
