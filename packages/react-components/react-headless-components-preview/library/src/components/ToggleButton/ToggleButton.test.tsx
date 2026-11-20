import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { isConformant } from '../../testing/isConformant';
import { ToggleButton } from './ToggleButton';

describe('ToggleButton', () => {
  isConformant({
    Component: ToggleButton,
    displayName: 'ToggleButton',
    requiredProps: { children: 'Toggle' },
  });

  it('renders a default state', () => {
    const result = render(<ToggleButton>Default ToggleButton</ToggleButton>);
    const button = result.getByRole('button', { name: 'Default ToggleButton' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders as checked when "checked" prop is true', () => {
    const result = render(<ToggleButton checked>Checked ToggleButton</ToggleButton>);
    const button = result.getByRole('button', { name: 'Checked ToggleButton' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-checked');
  });

  it('renders with state data attributes', () => {
    const result = render(
      <ToggleButton disabled disabledFocusable>
        Disabled ToggleButton
      </ToggleButton>,
    );
    const button = result.getByRole('button', { name: 'Disabled ToggleButton' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-disabled');
    expect(button).toHaveAttribute('data-disabled-focusable');
  });

  it('renders <ToggleButton> with icon only', () => {
    const result = render(<ToggleButton icon={<span>Icon</span>} aria-label="Icon ToggleButton" />);
    const button = result.getByRole('button', { name: 'Icon ToggleButton' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-icon-only');
  });

  it('toggles data-checked when an uncontrolled toggle button is clicked', () => {
    const { getByRole } = render(<ToggleButton>x</ToggleButton>);
    const button = getByRole('button', { name: 'x' });

    expect(button).not.toHaveAttribute('data-checked');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('data-checked');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).not.toHaveAttribute('data-checked');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts checked with defaultChecked', () => {
    const { getByRole } = render(<ToggleButton defaultChecked>x</ToggleButton>);

    expect(getByRole('button', { name: 'x' })).toHaveAttribute('data-checked');
  });

  it('keeps data-checked in sync with a controlled checked prop', () => {
    const { getByRole, rerender } = render(<ToggleButton checked={false}>x</ToggleButton>);
    const button = getByRole('button', { name: 'x' });

    fireEvent.click(button);
    expect(button).not.toHaveAttribute('data-checked');

    rerender(<ToggleButton checked>x</ToggleButton>);
    expect(button).toHaveAttribute('data-checked');
  });
});
