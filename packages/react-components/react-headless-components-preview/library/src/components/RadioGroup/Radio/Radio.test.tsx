import * as React from 'react';
import { render } from '@testing-library/react';
import { isConformant } from '../../../testing/isConformant';
import { Radio } from './Radio';
import { RadioGroup } from '../RadioGroup';

describe('Radio', () => {
  isConformant({
    Component: Radio,
    displayName: 'Radio',
    primarySlot: 'input',
    requiredProps: { label: 'Radio', value: 'r' },
    disabledTests: ['has-top-level-file-extra'],
  });

  it('renders data-disabled when disabled', () => {
    const { container } = render(<Radio disabled label="x" value="x" />);

    expect(container.firstElementChild!).toHaveAttribute('data-disabled');
  });

  it('inherits data-disabled from a disabled RadioGroup', () => {
    const { getByLabelText } = render(
      <RadioGroup disabled>
        <Radio value="a" label="A" />
      </RadioGroup>,
    );

    expect(getByLabelText('A').parentElement!).toHaveAttribute('data-disabled');
  });
});
