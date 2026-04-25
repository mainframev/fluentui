import * as React from 'react';
import { Divider } from '@fluentui/react-headless-components-preview';

import { VerticalCss } from './DividerVertical.css';
import verticalTailwindSource from './DividerVertical.stories.tsx?raw';
import verticalCssSource from './DividerVertical.css.tsx?raw';
import verticalCssModuleSource from './DividerVertical.module.css?raw';

export const Vertical = (): React.ReactNode => (
  <div className="flex items-center h-4 gap-4">
    <a href="#">Link 1</a>
    <Divider className="w-px h-full bg-gray-300" vertical />
    <a href="#">Link 2</a>
  </div>
);

Vertical.parameters = {
  variants: {
    tailwind: {
      label: 'Tailwind',
      files: [{ name: 'DividerVertical.tsx', source: verticalTailwindSource }],
    },
    css: {
      label: 'CSS',
      component: VerticalCss,
      files: [
        { name: 'DividerVertical.tsx', source: verticalCssSource, language: 'tsx' },
        { name: 'DividerVertical.module.css', source: verticalCssModuleSource, language: 'css' },
      ],
    },
  },
};
