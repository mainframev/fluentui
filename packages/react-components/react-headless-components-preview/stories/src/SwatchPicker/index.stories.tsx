import * as React from 'react';
import {
  ColorSwatch,
  colorSwatchDataAttributes,
  EmptySwatch,
  emptySwatchDataAttributes,
  ImageSwatch,
  imageSwatchDataAttributes,
  SwatchPicker,
  swatchPickerDataAttributes,
  SwatchPickerRow,
} from '@fluentui/react-headless-components-preview/swatch-picker';
import descriptionMd from './SwatchPickerDescription.md';
import styles from './swatch-picker.module.css';
import { getBrowserSupportNotice } from '../shared/browserSupportNotice';

export { Default } from './SwatchPickerDefault.stories';
export { EmptySwatchExample } from './SwatchPickerEmpty.stories';
export { Grid } from './SwatchPickerGrid.stories';
export { ImageSwatchExample } from './SwatchPickerImage.stories';

export default {
  title: 'Components/SwatchPicker',
  component: SwatchPicker,
  subcomponents: { ColorSwatch, EmptySwatch, ImageSwatch, SwatchPickerRow },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            SwatchPicker: {
              attributes: swatchPickerDataAttributes,
              values: { root: { layout: ['row', 'grid'] } },
            },
            ColorSwatch: { attributes: colorSwatchDataAttributes },
            EmptySwatch: { attributes: emptySwatchDataAttributes },
            ImageSwatch: { attributes: imageSwatchDataAttributes },
          },
        },
      },
    },
    docs: {
      description: {
        component: descriptionMd + getBrowserSupportNotice('SwatchPicker'),
      },
    },
  },
  decorators: [
    (Story: React.ComponentType): React.ReactNode => (
      <div className={styles.story}>
        <Story />
      </div>
    ),
  ],
};
