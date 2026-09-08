import {
  AlphaSlider,
  alphaSliderDataAttributes,
  ColorArea,
  ColorPicker,
  ColorSlider,
  colorSliderDataAttributes,
} from '@fluentui/react-headless-components-preview/color-picker';

import descriptionMd from './ColorPickerDescription.md';
import './color-picker.module.css';

export { ColorPickerDefault } from './ColorPickerDefault.stories';
export { ColorAreaDefault } from './ColorAreaDefault.stories';
export { ColorSliderDefault } from './ColorSliderDefault.stories';
export { AlphaSliderDefault } from './AlphaSliderDefault.stories';

export default {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  subcomponents: {
    AlphaSlider,
    ColorArea,
    ColorSlider,
  },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            AlphaSlider: {
              attributes: alphaSliderDataAttributes,
              values: {
                root: {
                  channel: ['alpha'],
                  orientation: ['horizontal', 'vertical'],
                },
              },
            },
            ColorSlider: {
              attributes: colorSliderDataAttributes,
              values: {
                root: {
                  channel: ['hue', 'saturation', 'value'],
                  orientation: ['horizontal', 'vertical'],
                },
              },
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
