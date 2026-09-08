import { Spinner, spinnerDataAttributes } from '@fluentui/react-headless-components-preview/spinner';

import descriptionMd from './SpinnerDescription.md';
export { Default } from './SpinnerDefault.stories';
export { Labels } from './SpinnerLabels.stories';

export default {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: spinnerDataAttributes,
          values: { root: { labelPosition: ['before', 'after', 'above', 'below'] } },
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
