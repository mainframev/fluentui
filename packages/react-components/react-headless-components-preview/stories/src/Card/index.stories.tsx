import {
  Card,
  cardDataAttributes,
  CardHeader,
  CardPreview,
  CardFooter,
} from '@fluentui/react-headless-components-preview/card';

import descriptionMd from './CardDescription.md';
export { Default } from './CardDefault.stories';
export { Selectable } from './CardSelectable.stories';
export { Disabled } from './CardDisabled.stories';

export default {
  title: 'Components/Card',
  component: Card,
  subcomponents: { CardHeader, CardPreview, CardFooter },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: { attributes: cardDataAttributes },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
