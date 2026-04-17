import * as React from 'react';
import { Divider } from '@fluentui/react-headless-components-preview';

const css = `
.hc-divider-container {
  display: flex;
  flex-direction: column;
  max-width: 12rem;
  width: 100%;
  gap: 0.5rem;
}

.hc-divider-container p {
  margin: 0;
}

.hc-divider {
  height: 1px;
  background-color: #d1d5db;
}
`;

export const DefaultCss = (): React.ReactNode => (
  <>
    <style>{css}</style>
    <div className="hc-divider-container">
      <p>Content above the divider</p>
      <Divider className="hc-divider" />
      <p>Content below the divider</p>
    </div>
  </>
);
