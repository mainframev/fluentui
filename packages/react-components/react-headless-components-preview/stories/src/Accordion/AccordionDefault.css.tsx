import * as React from 'react';
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from '@fluentui/react-headless-components-preview';
import { ChevronRightRegular } from '@fluentui/react-icons';

const css = `
.hc-accordion {
  display: flex;
  width: 100%;
  max-width: 24rem;
  flex-direction: column;
  justify-content: center;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.hc-accordion-item {
  border-bottom: 1px solid #e5e7eb;
}

.hc-accordion-header-btn {
  border: none;
  position: relative;
  display: flex;
  width: 100%;
  align-items: baseline;
  gap: 0.75rem;
  background-color: #f3f4f6;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
}

.hc-accordion-header-btn:hover {
  background-color: #e5e7eb;
}

.hc-accordion-header-btn:focus-visible {
  z-index: 1;
  outline: 2px solid #3b82f6;
}

.hc-accordion-expand-icon {
  transition: transform 0.2s;
}

.hc-accordion-item[data-open] .hc-accordion-expand-icon {
  transform: rotate(90deg);
}

.hc-accordion-panel {
  overflow: hidden;
  font-size: 1rem;
  color: #4b5563;
  transition: height 0.2s ease-out;
  height: 0;
  padding: 0 0.75rem;
}

.hc-accordion-item[data-open] .hc-accordion-panel {
  height: max-content;
}
`;

const items = [
  { value: 'item-1', header: 'Accordion Header 1', panel: 'Accordion Panel 1' },
  { value: 'item-2', header: 'Accordion Header 2', panel: 'Accordion Panel 2' },
  { value: 'item-3', header: 'Accordion Header 3', panel: 'Accordion Panel 3' },
];

export const DefaultCss = (): React.ReactNode => (
  <>
    <style>{css}</style>
    <Accordion className="hc-accordion">
      {items.map(item => (
        <AccordionItem className="hc-accordion-item" key={item.value} value={item.value}>
          <AccordionHeader
            button={{ className: 'hc-accordion-header-btn' }}
            expandIcon={<ChevronRightRegular className="hc-accordion-expand-icon" />}
          >
            {item.header}
          </AccordionHeader>
          <AccordionPanel className="hc-accordion-panel">{item.panel}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  </>
);
