'use client';

import * as React from 'react';

export const DialogBackdropContext = React.createContext<boolean | undefined>(undefined);

export const DialogBackdropProvider = DialogBackdropContext.Provider;

export const useDialogBackdropContext = (isNestedDialog: boolean): boolean => {
  const backdropOverride = React.useContext(DialogBackdropContext);
  return backdropOverride !== undefined ? backdropOverride : isNestedDialog;
};
