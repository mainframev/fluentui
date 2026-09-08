import {
  MessageBar,
  messageBarDataAttributes,
  MessageBarActions,
  messageBarActionsDataAttributes,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-headless-components-preview/message-bar';

import descriptionMd from './MessageBarDescription.md';
export { Default } from './MessageBarDefault.stories';
export { Intent } from './MessageBarIntent.stories';

export default {
  title: 'Components/MessageBar',
  component: MessageBar,
  subcomponents: {
    MessageBarBody,
    MessageBarTitle,
    MessageBarActions,
  },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            MessageBar: {
              attributes: messageBarDataAttributes,
              values: {
                root: {
                  layout: ['singleline', 'multiline'],
                  intent: ['info', 'success', 'warning', 'error'],
                },
              },
            },
            MessageBarActions: {
              attributes: messageBarActionsDataAttributes,
              values: {
                root: {
                  layout: ['singleline', 'multiline'],
                },
              },
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
