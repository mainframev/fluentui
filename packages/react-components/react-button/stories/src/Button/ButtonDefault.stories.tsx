import * as React from 'react';
import type { JSXElement } from '@fluentui/react-components';
import { Button, FluentProvider } from '@fluentui/react-components';
import type { ButtonProps } from '@fluentui/react-components';

export const Default = (props: ButtonProps): JSXElement => (
  <FluentProvider
    overrides_unstable={{
      smartHover: true,
    }}
  >
    <Button {...props}>Example</Button>
  </FluentProvider>
);
