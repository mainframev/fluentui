import * as React from 'react';
import { Divider } from '@fluentui/react-headless-components-preview';

import styles from './DividerDefault.module.css';

export const DefaultCss = (): React.ReactNode => (
  <div className={styles.container}>
    <p>Content above the divider</p>
    <Divider className={styles.divider} />
    <p>Content below the divider</p>
  </div>
);
