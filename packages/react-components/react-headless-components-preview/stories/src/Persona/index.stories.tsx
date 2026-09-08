import { Avatar } from '@fluentui/react-headless-components-preview/avatar';
import { Persona, personaDataAttributes } from '@fluentui/react-headless-components-preview/persona';

import descriptionMd from './PersonaDescription.md';

export { Default } from './PersonaDefault.stories';

export default {
  title: 'Components/Persona',
  component: Persona,
  subcomponent: { Avatar },
  parameters: {
    reactStorybookAddon: {
      docs: {
        dataAttributes: {
          attributes: personaDataAttributes,
          values: { root: { textPosition: ['after', 'before', 'below'] } },
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
