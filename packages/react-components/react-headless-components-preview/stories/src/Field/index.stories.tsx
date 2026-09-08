import { Field, fieldDataAttributes } from '@fluentui/react-headless-components-preview/field';

import descriptionMd from './FieldDescription.md';
export { Default } from './FieldDefault.stories';

export default {
  title: 'Components/Field',
  component: Field,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: fieldDataAttributes,
          values: {
            root: {
              validateState: ['error', 'warning', 'success', 'none'],
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
