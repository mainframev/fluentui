import { SpinButton, spinButtonDataAttributes } from '@fluentui/react-headless-components-preview/spin-button';

import descriptionMd from './SpinButtonDescription.md';
export { Default } from './SpinButtonDefault.stories';

export default {
  title: 'Components/SpinButton',
  component: SpinButton,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: spinButtonDataAttributes,
          values: {
            root: {
              spinState: ['up', 'down'],
              atBound: ['min', 'max', 'both'],
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
