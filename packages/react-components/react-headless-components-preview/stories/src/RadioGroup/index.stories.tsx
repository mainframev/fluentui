import { RadioGroup, Radio, radioDataAttributes } from '@fluentui/react-headless-components-preview/radio-group';

import descriptionMd from './RadioGroupDescription.md';
export { Default } from './RadioGroupDefault.stories';

export default {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            Radio: {
              attributes: radioDataAttributes,
              values: { root: { labelPosition: ['after', 'below'] } },
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
