import { Slider, sliderDataAttributes } from '@fluentui/react-headless-components-preview/slider';

import descriptionMd from './SliderDescription.md';
export { Default } from './SliderDefault.stories';

export default {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: { attributes: sliderDataAttributes },
      },
    },
    docs: {
      description: {
        component: descriptionMd,
      },
    },
  },
};
