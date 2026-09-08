import { ToggleButton, toggleButtonDataAttributes } from '@fluentui/react-headless-components-preview/toggle-button';

import descriptionMd from './ToggleButtonDescription.md';
export { Default } from './ToggleButtonDefault.stories';

export default {
  title: 'Components/ToggleButton',
  component: ToggleButton,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: toggleButtonDataAttributes,
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
