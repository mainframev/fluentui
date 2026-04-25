import * as React from 'react';
import { Divider } from '@fluentui/react-headless-components-preview';

import styles from './DividerVertical.module.css';

export const VerticalCss = (): React.ReactNode => (
  <div className={styles.container}>
    <a href="#">Link 1</a>
    <Divider className={styles.divider} vertical />
    <a href="#">Link 2</a>
  </div>
);
