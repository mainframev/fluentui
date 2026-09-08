import { Rating, RatingItem, ratingItemDataAttributes } from '@fluentui/react-headless-components-preview/rating';

import descriptionMd from './RatingDescription.md';
export { Default } from './RatingDefault.stories';

export default {
  title: 'Components/Rating',
  component: Rating,
  subcomponents: { RatingItem },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            RatingItem: {
              attributes: ratingItemDataAttributes,
              values: { root: { appearance: ['filled', 'filled-half', 'outline'] } },
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
