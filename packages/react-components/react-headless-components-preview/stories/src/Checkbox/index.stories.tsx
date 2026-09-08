import { Checkbox, checkboxDataAttributes } from '@fluentui/react-headless-components-preview/checkbox';

import descriptionMd from './CheckboxDescription.md';
export { Default } from './CheckboxDefault.stories';

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: checkboxDataAttributes,
          values: {
            root: {
              checked: ['boolean', 'mixed'],
              labelPosition: ['before', 'after'],
            },
          },
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
