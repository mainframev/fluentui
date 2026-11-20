import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { isConformant } from '../../testing/isConformant';
import { RadioGroup } from './RadioGroup';
import { Radio } from './Radio';

describe('RadioGroup', () => {
  isConformant({
    Component: RadioGroup,
    displayName: 'RadioGroup',
  });

  it('renders a default state', () => {
    const { getByRole, getByText } = render(<RadioGroup>Default RadioGroup</RadioGroup>);
    const radiogroup = getByRole('radiogroup');

    expect(radiogroup).toBeInTheDocument();
    expect(getByText('Default RadioGroup')).toBeInTheDocument();
  });

  it('selects radios natively in an uncontrolled group', () => {
    const { getByLabelText } = render(
      <RadioGroup defaultValue="a">
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>,
    );

    expect(getByLabelText('A')).toBeChecked();
    expect(getByLabelText('B')).not.toBeChecked();

    fireEvent.click(getByLabelText('B'));

    expect(getByLabelText('B')).toBeChecked();
    expect(getByLabelText('A')).not.toBeChecked();
  });
});
