import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
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

  it('sets data-checked on the radio matching defaultValue', () => {
    const { getByLabelText } = render(
      <RadioGroup defaultValue="a">
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>,
    );
    const rootA = getByLabelText('A').parentElement!;
    const rootB = getByLabelText('B').parentElement!;

    expect(rootA.tagName).toBe('SPAN');
    expect(rootA).toHaveAttribute('data-checked');
    expect(rootB).not.toHaveAttribute('data-checked');
  });

  it('moves data-checked when another radio is selected in an uncontrolled group', () => {
    const { getByLabelText } = render(
      <RadioGroup defaultValue="a">
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>,
    );
    const rootA = getByLabelText('A').parentElement!;
    const rootB = getByLabelText('B').parentElement!;

    fireEvent.click(getByLabelText('B'));

    expect(rootB).toHaveAttribute('data-checked');
    expect(rootA).not.toHaveAttribute('data-checked');
  });

  it('follows a controlled RadioGroup value', () => {
    const tree = (value: string) => (
      <RadioGroup value={value}>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>
    );
    const { getByLabelText, rerender } = render(tree('a'));
    const rootA = getByLabelText('A').parentElement!;
    const rootB = getByLabelText('B').parentElement!;

    fireEvent.click(getByLabelText('B'));
    expect(rootA).toHaveAttribute('data-checked');
    expect(rootB).not.toHaveAttribute('data-checked');

    rerender(tree('b'));
    expect(rootB).toHaveAttribute('data-checked');
    expect(rootA).not.toHaveAttribute('data-checked');
  });

  it('calls the user onChange once and still tracks selection', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <RadioGroup defaultValue="a" onChange={onChange}>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>,
    );

    fireEvent.click(getByLabelText('B'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.anything(), { value: 'b' });
    expect(getByLabelText('B').parentElement!).toHaveAttribute('data-checked');
  });

  it('tracks a standalone radio clicked outside any group', () => {
    const { getByLabelText } = render(<Radio value="x" label="X" />);
    const root = getByLabelText('X').parentElement!;

    expect(root).not.toHaveAttribute('data-checked');
    fireEvent.click(getByLabelText('X'));
    expect(root).toHaveAttribute('data-checked');
  });

  it('respects a Radio defaultChecked inside a group with no defaultValue', () => {
    const { getByLabelText } = render(
      <RadioGroup>
        <Radio value="a" label="A" defaultChecked />
        <Radio value="b" label="B" />
      </RadioGroup>,
    );

    expect(getByLabelText('A').parentElement!).toHaveAttribute('data-checked');
  });
});
