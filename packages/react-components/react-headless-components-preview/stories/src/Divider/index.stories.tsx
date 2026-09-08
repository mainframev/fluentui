import { Divider, dividerDataAttributes } from '@fluentui/react-headless-components-preview/divider';

import descriptionMd from './DividerDescription.md';
export { Default } from './DividerDefault.stories';
export { Vertical } from './DividerVertical.stories';

export default {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: dividerDataAttributes,
          values: { root: { orientation: ['horizontal', 'vertical'] } },
        },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
