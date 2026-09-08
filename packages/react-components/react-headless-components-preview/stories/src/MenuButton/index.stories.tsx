import { MenuButton, menuButtonDataAttributes } from '@fluentui/react-headless-components-preview/menu-button';

import descriptionMd from './MenuButtonDescription.md';

export { Default } from './MenuButtonDefault.stories';

export default {
  title: 'Components/MenuButton',
  component: MenuButton,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: { attributes: menuButtonDataAttributes },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
