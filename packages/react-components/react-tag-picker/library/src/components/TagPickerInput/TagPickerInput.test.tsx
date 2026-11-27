import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { isConformant } from '../../testing/isConformant';
import { TagPickerInput } from './TagPickerInput';
import { TagPicker } from '../TagPicker/TagPicker';
import { TagPickerControl } from '../TagPickerControl/TagPickerControl';
import { TagPickerList } from '../TagPickerList/TagPickerList';
import { TagPickerOption } from '../TagPickerOption/TagPickerOption';

describe('TagPickerInput', () => {
  isConformant({
    Component: TagPickerInput,
    displayName: 'TagPickerInput',
    disabledTests: [
      // clearIcon and expandIcon are not rendered on the root component
      'component-has-static-classnames-object',
    ],
  });

  // TODO add more tests here, and create visual regression tests in /apps/vr-tests

  it('renders a default state', () => {
    const result = render(<TagPickerInput />);
    expect(result.container).toMatchSnapshot();
  });

  describe('IME composition', () => {
    it.each<[string, KeyboardEventInit]>([
      ['isComposing', { key: 'Enter', isComposing: true }],
      ['keyCode 229', { key: 'Enter', keyCode: 229 }],
    ])('does not clear the query or close on Enter with %s', (_, init) => {
      const onOpenChange = jest.fn();
      const { getByRole } = render(
        <TagPicker open onOpenChange={onOpenChange}>
          <TagPickerControl>
            <TagPickerInput aria-label="Select animals" />
          </TagPickerControl>
          <TagPickerList>
            <TagPickerOption value="cat">Cat</TagPickerOption>
          </TagPickerList>
        </TagPicker>,
      );
      const input = getByRole('combobox') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.keyDown(input, init);

      expect(input.value).toBe('ab');
      expect(onOpenChange).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ open: false }));
    });
  });
});
