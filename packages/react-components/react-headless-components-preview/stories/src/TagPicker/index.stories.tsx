import {
  TagPicker,
  TagPickerControl,
  tagPickerControlDataAttributes,
  TagPickerGroup,
  tagPickerGroupDataAttributes,
  TagPickerInput,
  tagPickerInputDataAttributes,
  TagPickerButton,
  tagPickerButtonDataAttributes,
  TagPickerList,
  TagPickerOption,
} from '@fluentui/react-headless-components-preview/tag-picker';

import descriptionMd from './TagPickerDescription.md';

import { getBrowserSupportNotice } from '../shared/browserSupportNotice';

export { Default } from './TagPickerDefault.stories';
export { Filtering } from './TagPickerFiltering.stories';
export { SecondaryAction } from './TagPickerSecondaryAction.stories';
export { Grouped } from './TagPickerGrouped.stories';
export { SingleSelect } from './TagPickerSingleSelect.stories';
export { TruncatedText } from './TagPickerTruncatedText.stories';
export { NoPopover } from './TagPickerNoPopover.stories';

export default {
  title: 'Components/TagPicker',
  component: TagPicker,
  subcomponents: { TagPickerControl, TagPickerGroup, TagPickerInput, TagPickerButton, TagPickerList, TagPickerOption },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            TagPickerButton: { attributes: tagPickerButtonDataAttributes },
            TagPickerControl: { attributes: tagPickerControlDataAttributes },
            TagPickerGroup: { attributes: tagPickerGroupDataAttributes },
            TagPickerInput: { attributes: tagPickerInputDataAttributes },
          },
        },
      },
    },
    docs: {
      description: {
        component: [descriptionMd, getBrowserSupportNotice('TagPicker')].join('\n'),
      },
    },
  },
};
