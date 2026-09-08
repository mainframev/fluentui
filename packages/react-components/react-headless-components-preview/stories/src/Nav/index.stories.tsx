import {
  Nav,
  NavItem,
  navItemDataAttributes,
  NavSubItem,
  navSubItemDataAttributes,
  NavCategory,
  NavCategoryItem,
  navCategoryItemDataAttributes,
  NavSubItemGroup,
  NavDivider,
  NavSectionHeader,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavDrawerFooter,
} from '@fluentui/react-headless-components-preview/nav';

import descriptionMd from './NavDescription.md';

import { getBrowserSupportNotice } from '../shared/browserSupportNotice';

export { Default } from './NavDefault.stories';
export { WithCategories } from './NavWithCategories.stories';
export { Controlled } from './NavControlled.stories';
export { NavDrawerBasic } from './NavDrawerBasic.stories';
export { NavDrawerControlled } from './NavDrawerControlled.stories';

export default {
  title: 'Components/Nav',
  component: Nav,
  subcomponents: {
    NavItem,
    NavSubItem,
    NavCategory,
    NavCategoryItem,
    NavSubItemGroup,
    NavDivider,
    NavSectionHeader,
    NavDrawer,
    NavDrawerBody,
    NavDrawerHeader,
    NavDrawerFooter,
  },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            NavItem: { attributes: navItemDataAttributes },
            NavSubItem: { attributes: navSubItemDataAttributes },
            NavCategoryItem: { attributes: navCategoryItemDataAttributes },
          },
        },
      },
    },
    docs: {
      description: {
        component: [descriptionMd, getBrowserSupportNotice('Nav')].join('\n'),
      },
    },
  },
};
