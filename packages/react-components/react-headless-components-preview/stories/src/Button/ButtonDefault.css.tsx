import * as React from 'react';
import { Button } from '@fluentui/react-headless-components-preview';

import styles from './ButtonDefault.module.css';

export const DefaultCss = (): React.ReactNode => (
  <div className={styles.container}>
    <Button className={styles.button}>Button</Button>
    <Button className={styles.button} disabled>
      Button disabled
    </Button>
    <Button className={styles.button} disabled disabledFocusable>
      Button disabled focusable
    </Button>
  </div>
);
