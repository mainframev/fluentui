import { SearchBox, searchBoxDataAttributes } from '@fluentui/react-headless-components-preview/search-box';

import descriptionMd from './SearchBoxDescription.md';
export { Default } from './SearchBoxDefault.stories';

export default {
  title: 'Components/SearchBox',
  component: SearchBox,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: { attributes: searchBoxDataAttributes },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
