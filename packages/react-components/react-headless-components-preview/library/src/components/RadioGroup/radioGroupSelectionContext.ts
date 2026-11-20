'use client';

import * as React from 'react';

/**
 * Internal: the value currently selected in the nearest headless RadioGroup.
 * `undefined` value means "nothing selected yet"; a missing provider means "no headless RadioGroup".
 */
export type RadioGroupSelection = { selectedValue: string | undefined };

const RadioGroupSelectionContext = React.createContext<RadioGroupSelection | undefined>(undefined);

export const RadioGroupSelectionProvider = RadioGroupSelectionContext.Provider;
export const useRadioGroupSelection = (): RadioGroupSelection | undefined =>
  React.useContext(RadioGroupSelectionContext);
