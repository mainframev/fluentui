import * as React from 'react';
import { Button } from '@fluentui/react-headless-components-preview';

const css = `
.hc-btn-container {
  display: flex;
  gap: 1rem;
}

.hc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  padding: 0 1rem;
  margin: 0;
  outline: 0;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  background-color: #2563eb;
  font: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  color: #fff;
  user-select: none;
  cursor: pointer;
}

.hc-btn:hover {
  background-color: #1d4ed8;
}

.hc-btn:active {
  background-color: #1e40af;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.hc-btn:focus-visible {
  outline: 2px solid #000;
  outline-offset: 2px;
}

.hc-btn[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.hc-btn[data-disabled]:hover {
  background-color: #2563eb;
}

.hc-btn[data-disabled]:active {
  background-color: #2563eb;
  box-shadow: none;
}
`;

export const DefaultCss = (): React.ReactNode => (
  <>
    <style>{css}</style>
    <div className="hc-btn-container">
      <Button className="hc-btn">Button</Button>
      <Button className="hc-btn" disabled>
        Button disabled
      </Button>
      <Button className="hc-btn" disabled disabledFocusable>
        Button disabled focusable
      </Button>
    </div>
  </>
);
