import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { isConformant } from '../../testing/isConformant';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  isConformant({
    Component: Checkbox,
    displayName: 'Checkbox',
    primarySlot: 'input',
    requiredProps: { label: 'Checkbox' },
  });

  it('renders a default state', () => {
    const { getByRole, getByText } = render(<Checkbox defaultChecked label="Default Checkbox" />);
    const checkbox = getByRole('checkbox');

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    expect(getByText('Default Checkbox')).toBeInTheDocument();
  });

  it('renders with data-checked attribute when checked', () => {
    const { container } = render(<Checkbox defaultChecked label="Checked" />);
    const root = container.firstElementChild!;

    expect(root).toHaveAttribute('data-checked');
  });

  it('renders with data-disabled attribute when disabled', () => {
    const { container } = render(<Checkbox disabled label="Disabled" />);
    const root = container.firstElementChild!;

    expect(root).toHaveAttribute('data-disabled');
  });

  it('toggles data-checked when an uncontrolled checkbox is clicked', () => {
    const { container, getByRole } = render(<Checkbox label="x" />);
    const root = container.firstElementChild!;
    const input = getByRole('checkbox');

    expect(root).not.toHaveAttribute('data-checked');
    fireEvent.click(input);
    expect(root).toHaveAttribute('data-checked');
    fireEvent.click(input);
    expect(root).not.toHaveAttribute('data-checked');
  });

  it('renders data-checked="mixed" when checked is mixed', () => {
    const { container } = render(<Checkbox checked="mixed" label="x" />);
    const root = container.firstElementChild!;

    expect(root).toHaveAttribute('data-checked', 'mixed');
  });

  it('moves from mixed to checked when an uncontrolled mixed checkbox is clicked', () => {
    const { container, getByRole } = render(<Checkbox defaultChecked="mixed" label="x" />);
    const root = container.firstElementChild!;

    expect(root).toHaveAttribute('data-checked', 'mixed');
    fireEvent.click(getByRole('checkbox'));
    expect(root).toHaveAttribute('data-checked', '');
  });

  it('keeps data-checked in sync with a controlled checked prop', () => {
    const { container, getByRole, rerender } = render(<Checkbox checked={false} label="x" />);
    const root = container.firstElementChild!;

    fireEvent.click(getByRole('checkbox'));
    expect(root).not.toHaveAttribute('data-checked');

    rerender(<Checkbox checked label="x" />);
    expect(root).toHaveAttribute('data-checked');
  });
});
