export { createComponent } from './createComponent';
export type { IComponent, IComponentOptions, IComponentStyles, ICustomizationProps, IFactoryOptions, IPropsWithChildren, IStateComponentType, IStyleableComponentProps, IStylesFunction, IStylesFunctionOrObject, IToken, ITokenBase, ITokenBaseArray, ITokenFunction, ITokenFunctionOrObject, IViewComponent } from './IComponent';
export type { IHTMLElementSlot, IHTMLSlot } from './IHTMLSlots';
export type { ExtractProps, ExtractShorthand, IDefaultSlotProps, IProcessedSlotProps, ISlot, ISlotCreator, ISlotDefinition, ISlotFactory, ISlotOptions, ISlotProp, ISlotRender, ISlots, ISlottableComponentType, ISlottableProps, ISlottableReactType, ValidProps, ValidShorthand } from './ISlots';
export { createFactory, getSlots, withSlots } from './slots';
export type { IThemeProviderProps } from './ThemeProvider';
export { ThemeProvider } from './ThemeProvider';
export type { IControlledStateOptions } from './hooks/index';
export { getControlledDerivedProps, useControlledState } from './hooks/index';

export { styled as legacyStyled } from '@fluentui/utilities';

import './version';
