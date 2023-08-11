import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Select } from 'src/components/common';

import { SelectHelper } from './test-utils';

const TextSelect = Select as typeof Select<string, boolean>;

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

describe('getSelectedOptions', () => {
  it('returns empty list when no options are selected', () => {
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
    const selectedOptions = select.getSelectedOptions();

    // Assert
    expect(selectedOptions).toEqual([]);
  });

  it('returns single-label list when one option is selected', () => {
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
        value: 'foo',
      })
    );

    // Act
    const select = new SelectHelper(screen.getByLabelText('Test Select'), user);
    const selectedOptions = select.getSelectedOptions();

    // Assert
    expect(selectedOptions).toEqual(['Foo']);
  });

  it('returns multiple-label list when multiple options are selected', () => {
    // Arrange
    const user = userEvent.setup();

    render(
      h(TextSelect, {
        isMulti: true,
        'aria-label': 'Test Select',
        options: [
          { label: 'Foo', value: 'foo' },
          { label: 'Bar', value: 'bar' },
          { label: 'Baz', value: 'baz' },
        ],
        value: ['foo', 'baz'],
      })
    );

    // Act
    const select = new SelectHelper(screen.getByLabelText('Test Select'), user);
    const selectedOptions = select.getSelectedOptions();

    // Assert
    expect(selectedOptions).toEqual(['Foo', 'Baz']);
  });
});
