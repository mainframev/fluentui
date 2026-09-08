import { Button, buttonDataAttributes } from '@fluentui/react-headless-components-preview/button';

import descriptionMd from './ButtonDescription.md';
export { Default } from './ButtonDefault.stories';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: buttonDataAttributes,
          values: { root: { iconPosition: ['before', 'after'] } },
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
