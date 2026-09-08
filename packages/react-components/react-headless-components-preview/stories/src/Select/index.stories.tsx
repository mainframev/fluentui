import { Select, selectDataAttributes } from '@fluentui/react-headless-components-preview/select';

import descriptionMd from './SelectDescription.md';
export { Default } from './SelectDefault.stories';

export default {
  title: 'Components/Select',
  component: Select,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: selectDataAttributes,
          values: { root: { invalid: ['boolean', 'grammar', 'spelling'] } },
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
