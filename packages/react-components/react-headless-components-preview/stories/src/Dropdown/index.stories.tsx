import {
  Dropdown,
  dropdownDataAttributes,
  Listbox,
  Option,
  optionDataAttributes,
  OptionGroup,
} from '@fluentui/react-headless-components-preview/dropdown';

import descriptionMd from './DropdownDescription.md';

import { getBrowserSupportNotice } from '../shared/browserSupportNotice';

export { Default } from './DropdownDefault.stories';
export { Multiselect } from './DropdownMultiselect.stories';
export { Controlled } from './DropdownControlled.stories';
export { Grouped } from './DropdownGrouped.stories';
export { ControllingOpenAndClose } from './DropdownControllingOpenAndClose.stories';
export { Disabled } from './DropdownDisabled.stories';

export default {
  title: 'Components/Dropdown',
  component: Dropdown,
  subcomponents: { Listbox, Option, OptionGroup },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            Dropdown: {
              attributes: dropdownDataAttributes,
              values: { root: { invalid: ['boolean', 'grammar', 'spelling'] } },
            },
            Option: { attributes: optionDataAttributes },
          },
        },
      },
    },
    docs: {
      description: {
        component: [descriptionMd, getBrowserSupportNotice('Dropdown')].join('\n'),
      },
    },
  },
};
