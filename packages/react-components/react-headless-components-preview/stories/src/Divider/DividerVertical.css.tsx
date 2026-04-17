import * as React from 'react';
import { Divider } from '@fluentui/react-headless-components-preview';

const css = `
.hc-divider-v-container {
  display: flex;
  align-items: center;
  height: 1rem;
  gap: 1rem;
}

.hc-divider-v {
  width: 1px;
  height: 100%;
  background-color: #d1d5db;
}
`;

export const VerticalCss = (): React.ReactNode => (
  <>
    <style>{css}</style>
    <div className="hc-divider-v-container">
      <a href="#">Link 1</a>
      <Divider className="hc-divider-v" vertical />
      <a href="#">Link 2</a>
    </div>
  </>
);
