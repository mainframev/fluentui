import * as React from 'react';

/** Lets component pages place the document heading after their preview controls. */
export const ComponentPageHeaderContext = React.createContext<
  | {
      title: React.ReactNode;
      description?: string;
    }
  | undefined
>(undefined);
