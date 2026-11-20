import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { isConformant } from '../../testing/isConformant';
import { TabList } from './TabList';
import { Tab } from './Tab';

describe('TabList', () => {
  isConformant({
    Component: TabList,
    displayName: 'TabList',
  });

  it('renders a default state', () => {
    const { getByRole, getAllByRole } = render(
      <TabList defaultSelectedValue="1">
        <Tab value="1">Tab 1</Tab>
        <Tab value="2">Tab 2</Tab>
        <Tab value="3">Tab 3</Tab>
      </TabList>,
    );
    const tablist = getByRole('tablist');

    expect(tablist).toBeInTheDocument();
    expect(tablist).toHaveAttribute('data-orientation', 'horizontal');
    expect(tablist).toHaveAttribute('focusgroup', 'tablist inline wrap nomemory');

    const tabs = getAllByRole('tab');

    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('data-selected');
  });

  it('renders with vertical orientation', () => {
    const { getByRole } = render(
      <TabList vertical>
        <Tab value="1">Tab 1</Tab>
        <Tab value="2">Tab 2</Tab>
        <Tab value="3">Tab 3</Tab>
      </TabList>,
    );
    const tablist = getByRole('tablist');

    expect(tablist).toHaveAttribute('data-orientation', 'vertical');
    expect(tablist).toHaveAttribute('focusgroup', 'tablist block wrap nomemory');
  });

  it('moves data-selected when an uncontrolled tab is clicked', () => {
    const { getAllByRole } = render(
      <TabList defaultSelectedValue="1">
        <Tab value="1">Tab 1</Tab>
        <Tab value="2">Tab 2</Tab>
        <Tab value="3">Tab 3</Tab>
      </TabList>,
    );
    const tabs = getAllByRole('tab');

    fireEvent.click(tabs[1]);

    expect(tabs[0]).not.toHaveAttribute('data-selected');
    expect(tabs[1]).toHaveAttribute('data-selected');
    expect(tabs[2]).not.toHaveAttribute('data-selected');
  });

  it('keeps data-selected in sync with a controlled selectedValue', () => {
    const tree = (selectedValue: string) => (
      <TabList selectedValue={selectedValue}>
        <Tab value="1">Tab 1</Tab>
        <Tab value="2">Tab 2</Tab>
        <Tab value="3">Tab 3</Tab>
      </TabList>
    );
    const { getAllByRole, rerender } = render(tree('1'));
    const tabs = getAllByRole('tab');

    fireEvent.click(tabs[1]);
    expect(tabs[0]).toHaveAttribute('data-selected');
    expect(tabs[1]).not.toHaveAttribute('data-selected');

    rerender(tree('3'));
    expect(tabs[0]).not.toHaveAttribute('data-selected');
    expect(tabs[1]).not.toHaveAttribute('data-selected');
    expect(tabs[2]).toHaveAttribute('data-selected');
  });

  it('sets data-disabled on a disabled tab', () => {
    const { getAllByRole } = render(
      <TabList>
        <Tab value="1">Tab 1</Tab>
        <Tab value="2" disabled>
          Tab 2
        </Tab>
        <Tab value="3">Tab 3</Tab>
      </TabList>,
    );
    const tabs = getAllByRole('tab');

    expect(tabs[0]).not.toHaveAttribute('data-disabled');
    expect(tabs[1]).toHaveAttribute('data-disabled');
    expect(tabs[2]).not.toHaveAttribute('data-disabled');
  });
});
