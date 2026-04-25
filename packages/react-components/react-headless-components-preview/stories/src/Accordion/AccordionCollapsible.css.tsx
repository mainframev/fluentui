import * as React from 'react';
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from '@fluentui/react-headless-components-preview';
import { ChevronRightRegular } from '@fluentui/react-icons';

import styles from './AccordionCollapsible.module.css';

const items = [
  { value: 'item-1', header: 'Accordion Header 1', panel: 'Accordion Panel 1' },
  { value: 'item-2', header: 'Accordion Header 2', panel: 'Accordion Panel 2' },
  { value: 'item-3', header: 'Accordion Header 3', panel: 'Accordion Panel 3' },
];

export const CollapsibleCss = (): React.ReactNode => (
  <Accordion className={styles.root} collapsible>
    {items.map(item => (
      <AccordionItem className={styles.item} key={item.value} value={item.value}>
        <AccordionHeader
          button={{ className: styles.headerButton }}
          expandIcon={<ChevronRightRegular className={styles.expandIcon} />}
        >
          {item.header}
        </AccordionHeader>
        <AccordionPanel className={styles.panel}>{item.panel}</AccordionPanel>
      </AccordionItem>
    ))}
  </Accordion>
);
