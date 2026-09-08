import { Switch, switchDataAttributes } from '@fluentui/react-headless-components-preview/switch';

import descriptionMd from './SwitchDescription.md';
export { Default } from './SwitchDefault.stories';

export default {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: switchDataAttributes,
          values: { root: { labelPosition: ['above', 'after', 'before'] } },
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
