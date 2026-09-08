import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  drawerFooterDataAttributes,
  DrawerHeader,
  drawerHeaderDataAttributes,
  DrawerHeaderNavigation,
  DrawerHeaderTitle,
  InlineDrawer,
  inlineDrawerDataAttributes,
  OverlayDrawer,
} from '@fluentui/react-headless-components-preview/drawer';

import descriptionMd from './DrawerDescription.md';

import { getBrowserSupportNotice } from '../shared/browserSupportNotice';

export { Default } from './DefaultDrawer.stories';
export { Inline } from './InlineDrawer.stories';

export default {
  title: 'Components/Drawer',
  component: Drawer,
  subcomponents: {
    OverlayDrawer,
    InlineDrawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerHeaderNavigation,
    DrawerBody,
    DrawerFooter,
  },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            InlineDrawer: {
              attributes: inlineDrawerDataAttributes,
              values: { root: { position: ['start', 'end', 'bottom'] } },
            },
            DrawerHeader: {
              attributes: drawerHeaderDataAttributes,
              values: { root: { scrollState: ['none', 'top', 'middle', 'bottom'] } },
            },
            DrawerFooter: {
              attributes: drawerFooterDataAttributes,
              values: { root: { scrollState: ['none', 'top', 'middle', 'bottom'] } },
            },
          },
        },
      },
    },
    docs: {
      description: {
        component: [descriptionMd, getBrowserSupportNotice('Drawer')].join('\n'),
      },
    },
  },
};
