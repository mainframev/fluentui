import { Breadcrumb, BreadcrumbButton, BreadcrumbItem, BreadcrumbDivider } from '@fluentui/react-components';
import * as React from 'react';
import descriptionMd from './BreadcrumbDescription.md';
export { Default } from './BreadcrumbDefault.stories';
export { BreadcrumbSize } from './BreadcrumbSize.stories';
export { BreadcrumbWithOverflow } from './BreadcrumbWithOverflow.stories';
export { BreadcrumbWithTooltip } from './BreadcrumbWithTooltip.stories';

import type { Meta } from '@storybook/react';

const metadata = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  subcomponents: {
    BreadcrumbItem: BreadcrumbItem as React.ComponentType<unknown>,
    BreadcrumbButton: BreadcrumbButton as React.ComponentType<unknown>,
    BreadcrumbDivider: BreadcrumbDivider as React.ComponentType<unknown>,
  },
  parameters: {
    docs: {
      description: {
        component: [descriptionMd].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default metadata;
