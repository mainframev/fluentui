import * as React from 'react';
import { Divider } from '@fluentui/react-headless-components-preview';

import { DefaultCss } from './DividerDefault.css';
import defaultTailwindSource from './DividerDefault.stories.tsx?raw';
import defaultCssSource from './DividerDefault.css.tsx?raw';
import defaultCssModuleSource from './DividerDefault.module.css?raw';

export const Default = (): React.ReactNode => (
  <div className="flex flex-col max-w-48 w-full gap-2 *:my-0">
    <p>Content above the divider</p>
    <Divider className="h-px bg-gray-300" />
    <p>Content below the divider</p>
  </div>
);

Default.parameters = {
  variants: {
    tailwind: {
      label: 'Tailwind',
      files: [{ name: 'DividerDefault.tsx', source: defaultTailwindSource }],
    },
    css: {
      label: 'CSS',
      component: DefaultCss,
      files: [
        { name: 'DividerDefault.tsx', source: defaultCssSource, language: 'tsx' },
        { name: 'DividerDefault.module.css', source: defaultCssModuleSource, language: 'css' },
      ],
    },
  },
};
