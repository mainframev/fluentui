import * as React from 'react';
import { Renderer } from './types';

// Provides a minimal functionality to render components without styles and without runtime errors.

const NoopProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children);

export const noopRenderer: Renderer = {
  registerUsage: () => {},
  unregisterUsage: () => {},

  renderFont: () => {},
  renderGlobal: () => {},
  renderRule: () => '',

  Provider: NoopProvider,
};
