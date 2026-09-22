import type * as React from 'react';
import { webDarkTheme, webLightTheme } from '@fluentui/react-theme';

export const docsControlTokens = {
  '--docs-gap': webLightTheme.spacingHorizontalS,
  '--docs-padding-x': webLightTheme.spacingHorizontalM,
  '--docs-padding-y': webLightTheme.spacingVerticalXS,
  '--docs-radius': webLightTheme.borderRadiusMedium,
  '--docs-round': webLightTheme.borderRadiusCircular,
  '--docs-font': webLightTheme.fontSizeBase300,
  '--docs-line': webLightTheme.lineHeightBase300,
  '--docs-height': `calc(${webLightTheme.lineHeightBase300} + ${webLightTheme.spacingVerticalM})`,
  '--docs-focus': webLightTheme.strokeWidthThick,
  '--docs-track': webLightTheme.spacingHorizontalXXXL,
  '--docs-indicator': webLightTheme.spacingHorizontalL,
  '--docs-thumb': webLightTheme.spacingHorizontalM,
  '--docs-inset': webLightTheme.spacingHorizontalXXS,
  '--docs-duration': webLightTheme.durationFast,
  '--docs-easing': webLightTheme.curveDecelerateMid,
  '--docs-bg-light': webLightTheme.colorNeutralBackground1,
  '--docs-bg-dark': webDarkTheme.colorNeutralBackground1,
  '--docs-fg-light': webLightTheme.colorNeutralForeground1,
  '--docs-fg-dark': webDarkTheme.colorNeutralForeground1,
  '--docs-border-light': webLightTheme.colorNeutralStroke1,
  '--docs-border-dark': webDarkTheme.colorNeutralStroke1,
  '--docs-muted-light': webLightTheme.colorNeutralForeground3,
  '--docs-muted-dark': webDarkTheme.colorNeutralForeground3,
} as React.CSSProperties;
