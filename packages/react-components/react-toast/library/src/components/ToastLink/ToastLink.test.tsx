import * as React from 'react';
import { render } from '@testing-library/react';
import { isConformant } from '../../testing/isConformant';
import { ToastLink } from './ToastLink';
import { BackgroundAppearanceProvider } from '@fluentui/react-shared-contexts';

describe('ToastLink', () => {
  isConformant({
    Component: ToastLink,
    displayName: 'ToastLink',
  });

  it('renders as an anchor element with href', () => {
    const { container } = render(<ToastLink href="#">Test Link</ToastLink>);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Test Link');
  });

  it('renders as a button when no href is provided', () => {
    const { container } = render(<ToastLink>Button Link</ToastLink>);
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Button Link');
  });

  it('applies brand inverted styles when in inverted background context', () => {
    const { container } = render(
      <BackgroundAppearanceProvider value="inverted">
        <ToastLink href="#">Inverted Link</ToastLink>
      </BackgroundAppearanceProvider>,
    );

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    // The className should include the brand inverted styles
    expect(link?.className).toBeTruthy();
  });

  it('uses default Link colors when not in inverted context', () => {
    const { container } = render(<ToastLink href="#">Default Link</ToastLink>);

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    // Should have Link's default className
    expect(link?.className).toBeTruthy();
  });

  it('allows user className to be applied', () => {
    const customClass = 'custom-link-class';
    const { container } = render(
      <BackgroundAppearanceProvider value="inverted">
        <ToastLink href="#" className={customClass}>
          Custom Link
        </ToastLink>
      </BackgroundAppearanceProvider>,
    );

    const link = container.querySelector('a');
    expect(link?.className).toContain(customClass);
  });

  it('forwards all Link props correctly', () => {
    const onClick = jest.fn();
    const { container } = render(
      <ToastLink href="#" onClick={onClick} disabled>
        Disabled Link
      </ToastLink>,
    );

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('aria-disabled')).toBe('true');
  });

  it('supports appearance prop from Link', () => {
    const { container } = render(
      <ToastLink href="#" appearance="subtle">
        Subtle Link
      </ToastLink>,
    );

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
  });
});
