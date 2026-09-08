import { Textarea, textareaDataAttributes } from '@fluentui/react-headless-components-preview/textarea';

import descriptionMd from './TextareaDescription.md';
export { Default } from './TextareaDefault.stories';

export default {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: textareaDataAttributes,
          values: {
            root: {
              resize: ['none', 'horizontal', 'vertical', 'both'],
              invalid: ['boolean', 'grammar', 'spelling'],
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
