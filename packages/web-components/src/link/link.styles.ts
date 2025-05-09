import { css } from '@microsoft/fast-element';
import { display, forcedColorsStylesheetBehavior } from '../utils/index.js';
import {
  colorBrandForegroundLink,
  colorBrandForegroundLinkHover,
  colorBrandForegroundLinkPressed,
  colorNeutralForeground2Link,
  colorNeutralForeground2LinkHover,
  colorNeutralForeground2LinkPressed,
  fontFamilyBase,
  fontSizeBase300,
  fontWeightRegular,
  strokeWidthThin,
} from '../theme/design-tokens.js';

export const styles = css`
  ${display('inline')}

  :host {
    position: relative;
    box-sizing: border-box;
    background-color: transparent;
    color: ${colorBrandForegroundLink};
    cursor: pointer;
    font-family: ${fontFamilyBase};
    font-size: ${fontSizeBase300};
    font-weight: ${fontWeightRegular};
    overflow: inherit;
    text-align: start;
    text-decoration: none;
    text-decoration-thickness: ${strokeWidthThin};
    text-overflow: inherit;
    user-select: text;
  }

  :host(:is(:hover, :focus-visible)) {
    outline: none;
    text-decoration-line: underline;
  }

  @media (hover: hover) {
    :host(:hover) {
      color: ${colorBrandForegroundLinkHover};
    }

    :host(:active) {
      color: ${colorBrandForegroundLinkPressed};
    }

    :host([appearance='subtle']:hover) {
      color: ${colorNeutralForeground2LinkHover};
    }

    :host([appearance='subtle']:active) {
      color: ${colorNeutralForeground2LinkPressed};
    }
  }

  :host([appearance='subtle']) {
    color: ${colorNeutralForeground2Link};
  }

  :host-context(:is(h1, h2, h3, h4, h5, h6, p, fluent-text)),
  :host([inline]) {
    font: inherit;
    text-decoration: underline;
  }

  :host(:not([href])) {
    color: inherit;
    text-decoration: none;
  }

  ::slotted(a) {
    position: absolute;
    inset: 0;
  }
`.withBehaviors(
  forcedColorsStylesheetBehavior(css`
    :host {
      color: LinkText;
    }
  `),
);
