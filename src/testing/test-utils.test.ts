import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Select } from 'src/components/common';

import { SelectHelper } from './test-utils';

const TextSelect = Select as typeof Select<string>;

describe('SelectHelper', () => {
  it('returns options from Select', async () => {
    // Arrange
    const user = userEvent.setup();

    render(
      h(TextSelect, {
        'aria-label': 'Test Select',
        options: [
          { label: 'Foo', value: 'foo' },
          { label: 'Bar', value: 'bar' },
          { label: 'Baz', value: 'baz' },
        ],
        value: null,
      })
    );

    // Act
    const select = new SelectHelper(screen.getByLabelText('Test Select'), user);
    const options = await select.getOptions();

    // Assert
    expect(options).toEqual(['Foo', 'Bar', 'Baz']);

    expect(screen.getByLabelText('Test Select')).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('selectOption', () => {
  it('it selects a Select option', async () => {
    // Arrange
    const user = userEvent.setup();

    const onChange = jest.fn();
    render(
      h(TextSelect, {
        'aria-label': 'Test Select',
        options: [
          { label: 'Foo', value: 'foo' },
          { label: 'Bar', value: 'bar' },
          { label: 'Baz', value: 'baz' },
        ],
        value: null,
        onChange,
      })
    );

    // Act
    const select = new SelectHelper(screen.getByLabelText('Test Select'), user);
    await select.selectOption('Bar');

    // Assert
    expect(onChange).toHaveBeenCalledWith({ label: 'Bar', value: 'bar' }, expect.any(Object));
  });
});
