import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import * as React from 'react';

/** Guide demos render inside a FluentProvider; the docsite host decides how to frame them. */
export function createGuideExample(Component: React.ComponentType, displayName: string): React.ComponentType {
  const Preview: ForwardRefComponent<React.ComponentProps<'div'>> = React.forwardRef((props, ref) => (
    <div {...props} ref={ref} data-fluent-preview="">
      <FluentProvider theme={webLightTheme}>
        <Component />
      </FluentProvider>
    </div>
  ));
  Preview.displayName = `${displayName}Preview`;
  return Preview;
}
