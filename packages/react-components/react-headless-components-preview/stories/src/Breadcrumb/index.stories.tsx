import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  breadcrumbButtonDataAttributes,
  BreadcrumbDivider,
} from '@fluentui/react-headless-components-preview/breadcrumb';

import descriptionMd from './BreadcrumbDescription.md';
export { Default } from './BreadcrumbDefault.stories';

export default {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  subcomponents: { BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: { attributes: breadcrumbButtonDataAttributes },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
