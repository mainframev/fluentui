'use client';

import * as React from 'react';
import type { BreadcrumbContextValues } from './Breadcrumb.types';

const BreadcrumbContext = React.createContext<BreadcrumbContextValues | undefined>(undefined);

/**
 * @internal
 */
export const breadcrumbDefaultValue: BreadcrumbContextValues = {
  size: 'medium',
};

/**
 * @internal
 */
export const BreadcrumbProvider: React.Provider<BreadcrumbContextValues | undefined> = BreadcrumbContext.Provider;

/**
 * @internal
 */
export const useBreadcrumbContext_unstable = (): BreadcrumbContextValues =>
  React.useContext(BreadcrumbContext) ?? breadcrumbDefaultValue;
