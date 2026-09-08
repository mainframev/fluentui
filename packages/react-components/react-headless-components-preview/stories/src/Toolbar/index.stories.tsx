import {
  Toolbar,
  toolbarDataAttributes,
  ToolbarButton,
  toolbarButtonDataAttributes,
  ToolbarDivider,
  toolbarDividerDataAttributes,
  ToolbarGroup,
  toolbarGroupDataAttributes,
  ToolbarRadioButton,
  toolbarRadioButtonDataAttributes,
  ToolbarRadioGroup,
  toolbarRadioGroupDataAttributes,
  ToolbarToggleButton,
  toolbarToggleButtonDataAttributes,
} from '@fluentui/react-headless-components-preview/toolbar';

import descriptionMd from './ToolbarDescription.md';

import { getBrowserSupportNotice } from '../shared/browserSupportNotice';

export { Default } from './ToolbarDefault.stories';
export { Vertical } from './ToolbarVertical.stories';
export { Toggle } from './ToolbarToggleButton.stories';
export { RadioButton } from './ToolbarRadioButton.stories';

export default {
  title: 'Components/Toolbar',
  component: Toolbar,
  subcomponents: {
    ToolbarButton,
    ToolbarDivider,
    ToolbarGroup,
    ToolbarRadioButton,
    ToolbarRadioGroup,
    ToolbarToggleButton,
  },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          components: {
            Toolbar: { attributes: toolbarDataAttributes },
            ToolbarButton: { attributes: toolbarButtonDataAttributes },
            ToolbarDivider: { attributes: toolbarDividerDataAttributes },
            ToolbarGroup: { attributes: toolbarGroupDataAttributes },
            ToolbarRadioButton: { attributes: toolbarRadioButtonDataAttributes },
            ToolbarRadioGroup: { attributes: toolbarRadioGroupDataAttributes },
            ToolbarToggleButton: { attributes: toolbarToggleButtonDataAttributes },
          },
        },
      },
    },
    docs: {
      description: {
        component: [descriptionMd, getBrowserSupportNotice('Toolbar')].join('\n'),
      },
    },
  },
};
