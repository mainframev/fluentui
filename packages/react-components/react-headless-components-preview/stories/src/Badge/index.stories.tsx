import { Badge, badgeDataAttributes } from '@fluentui/react-headless-components-preview/badge';

import descriptionMd from './BadgeDescription.md';
export { Default } from './BadgeDefault.stories';

import './badge.module.css';

export default {
  title: 'Components/Badge/Badge',
  component: Badge,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: badgeDataAttributes,
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
