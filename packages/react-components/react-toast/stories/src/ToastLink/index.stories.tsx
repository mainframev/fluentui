import { ToastLink } from '@fluentui/react-toast';

import descriptionMd from './ToastLinkDescription.md';
import bestPracticesMd from './ToastLinkBestPractices.md';

export { Default } from './ToastLinkDefault.stories';

export default {
  title: 'Components/ToastLink',
  component: ToastLink,
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
};
