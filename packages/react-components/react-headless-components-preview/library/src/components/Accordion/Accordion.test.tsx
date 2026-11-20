import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { isConformant } from '../../testing/isConformant';
import { Accordion } from './Accordion';
import { AccordionHeader } from './AccordionHeader/AccordionHeader';
import { AccordionItem } from './AccordionItem/AccordionItem';
import { AccordionPanel } from './AccordionPanel/AccordionPanel';

describe('Accordion', () => {
  isConformant({
    Component: Accordion,
    displayName: 'Accordion',
  });

  const items = [
    {
      id: 'item-1',
      header: 'Item #1 header',
      panel: 'Item #1 Panel',
    },
    {
      id: 'item-2',
      header: 'Item #2 header',
      panel: 'Item #2 Panel',
    },
  ];

  it('renders a default state', () => {
    const { getAllByRole, getByText } = render(
      <Accordion className="accordion" defaultOpenItems={items[0].id}>
        {items.map(item => (
          <AccordionItem className="accordion-item" key={item.id} value={item.id}>
            <AccordionHeader className="accordion-header">{item.header}</AccordionHeader>
            <AccordionPanel className="accordion-panel">{item.panel}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>,
    );

    const buttons = getAllByRole('button');
    expect(buttons).toHaveLength(2);

    // First item is open
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(getByText('Item #1 header')).toBeInTheDocument();
    expect(getByText('Item #1 Panel')).toBeInTheDocument();

    // Second item is closed
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
    expect(getByText('Item #2 header')).toBeInTheDocument();
    expect(getByText('Item #2 Panel')).toBeInTheDocument();
  });

  const renderAccordion = (props: React.ComponentProps<typeof Accordion> = {}) => (
    <Accordion {...props}>
      {items.map(item => (
        <AccordionItem className="accordion-item" key={item.id} value={item.id}>
          <AccordionHeader className="accordion-header">{item.header}</AccordionHeader>
          <AccordionPanel className="accordion-panel">{item.panel}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );

  it('sets data-open on the open item, its header and its panel', () => {
    const { container } = render(renderAccordion({ defaultOpenItems: items[0].id }));
    const itemRoots = container.querySelectorAll('.accordion-item');
    const headerRoots = container.querySelectorAll('.accordion-header');
    const panels = container.querySelectorAll('.accordion-panel');

    expect(itemRoots[0]).toHaveAttribute('data-open');
    expect(headerRoots[0]).toHaveAttribute('data-open');
    expect(itemRoots[1]).not.toHaveAttribute('data-open');
    expect(headerRoots[1]).not.toHaveAttribute('data-open');
    // A closed panel may be absent from the DOM, so only assert on the panel that exists for the open item.
    expect(panels[0]).toHaveAttribute('data-open');
  });

  it('moves data-open when another item is opened (uncontrolled)', () => {
    const { container, getAllByRole } = render(renderAccordion({ defaultOpenItems: items[0].id }));
    const itemRoots = container.querySelectorAll('.accordion-item');
    const headerRoots = container.querySelectorAll('.accordion-header');

    fireEvent.click(getAllByRole('button')[1]);

    expect(itemRoots[1]).toHaveAttribute('data-open');
    expect(headerRoots[1]).toHaveAttribute('data-open');
    expect(itemRoots[0]).not.toHaveAttribute('data-open');
    expect(headerRoots[0]).not.toHaveAttribute('data-open');
  });

  it('removes data-open when an open item is collapsed', () => {
    const { container, getAllByRole } = render(renderAccordion({ collapsible: true, defaultOpenItems: items[0].id }));
    const itemRoots = container.querySelectorAll('.accordion-item');

    fireEvent.click(getAllByRole('button')[0]);

    expect(itemRoots[0]).not.toHaveAttribute('data-open');
    expect(itemRoots[1]).not.toHaveAttribute('data-open');
  });

  it('keeps data-open in sync with controlled openItems', () => {
    const { container, getAllByRole, rerender } = render(renderAccordion({ openItems: [items[0].id] }));
    const itemRoots = container.querySelectorAll('.accordion-item');

    fireEvent.click(getAllByRole('button')[1]);
    expect(itemRoots[0]).toHaveAttribute('data-open');
    expect(itemRoots[1]).not.toHaveAttribute('data-open');

    rerender(renderAccordion({ openItems: [items[1].id] }));
    expect(itemRoots[1]).toHaveAttribute('data-open');
    expect(itemRoots[0]).not.toHaveAttribute('data-open');
  });
});
