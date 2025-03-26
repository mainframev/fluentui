import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { BreadcrumbBasicExample } from '../Breadcrumb/Breadcrumb.Basic.Example';

export const ShadowDOMBreadcrumbExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <BreadcrumbBasicExample />
    </Shadow>
  );
};
