import {
  AvatarGroup,
  avatarGroupDataAttributes,
  AvatarGroupItem,
  AvatarGroupPopover,
} from '@fluentui/react-headless-components-preview/avatar-group';

import descriptionMd from './AvatarGroupDescription.md';
export { Default } from './AvatarGroupDefault.stories';

export default {
  title: 'Components/AvatarGroup',
  component: AvatarGroup,
  subcomponents: { AvatarGroupItem, AvatarGroupPopover },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: avatarGroupDataAttributes,
          values: { root: { layout: ['spread', 'stack', 'pie'] } },
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
