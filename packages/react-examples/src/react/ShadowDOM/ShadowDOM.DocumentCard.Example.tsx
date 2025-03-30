import * as React from 'react';
import { Shadow } from './ShadowHelper';
import { DocumentCardBasicExample } from '../DocumentCard/DocumentCard.Basic.Example';

export const ShadowDOMDocumentCardExample: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <Shadow>
      <DocumentCardBasicExample />
    </Shadow>
  );
};
