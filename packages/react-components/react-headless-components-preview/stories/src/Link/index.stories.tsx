import { Link, linkDataAttributes } from '@fluentui/react-headless-components-preview/link';

import descriptionMd from './LinkDescription.md';
export { Default } from './LinkDefault.stories';

export default {
  title: 'Components/Link',
  component: Link,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: { attributes: linkDataAttributes },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
