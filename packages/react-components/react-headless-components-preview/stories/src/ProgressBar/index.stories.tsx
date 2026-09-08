import { ProgressBar, progressBarDataAttributes } from '@fluentui/react-headless-components-preview/progress-bar';

import descriptionMd from './ProgressBarDescription.md';
export { Default } from './ProgressBarDefault.stories';

export default {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: { attributes: progressBarDataAttributes },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
