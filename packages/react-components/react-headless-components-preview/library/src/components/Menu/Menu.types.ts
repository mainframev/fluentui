import type { MenuContextValue, MenuProps as MenuV9Props, MenuState as MenuV9State } from '@fluentui/react-menu';

export type { MenuContextValue, MenuOpenChangeData, MenuOpenEvent } from '@fluentui/react-menu';

/**
 * Props for the Menu component.
 *
 * Reuses the v9 Menu props while omitting `surfaceMotion` (v9 styling) for the headless preview API surface.
 */
export type MenuProps = Omit<MenuV9Props, 'surfaceMotion'>;

/**
 * State used in rendering Menu.
 *
 * Reuses the v9 Menu state while omitting the `surfaceMotion` slot and its `components` entry.
 */
export type MenuState = Omit<MenuV9State, 'surfaceMotion' | 'components'>;

export type MenuContextValues = { menu: MenuContextValue };
