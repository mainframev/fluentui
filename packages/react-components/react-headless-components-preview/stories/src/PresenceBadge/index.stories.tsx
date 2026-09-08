import { PresenceBadge, presenceBadgeDataAttributes } from '@fluentui/react-headless-components-preview/badge';

import descriptionMd from './PresenceBadgeDescription.md';
export { Default } from './PresenceBadgeDefault.stories';
export { OutOfOffice } from './PresenceBadgeOutOfOffice.stories';

import './presence-badge.module.css';

export default {
  title: 'Components/Badge/PresenceBadge',
  component: PresenceBadge,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: presenceBadgeDataAttributes,
          values: {
            root: {
              status: ['busy', 'out-of-office', 'away', 'available', 'offline', 'do-not-disturb', 'unknown', 'blocked'],
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
