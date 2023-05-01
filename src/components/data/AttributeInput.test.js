import { fireEvent, render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import AttributeInput, { AttributeTypeInput } from 'src/components/data/AttributeInput';

describe('AttributeTypeInput', () => {
  it('renders radio buttons for available types', () => {
    const { getAllByRole } = render(
      h(AttributeTypeInput, {
        value: { type: 'string' },
        onChange: jest.fn(),
      })
    );

    const radioButtons = getAllByRole('radio');
    const labels = Array.from(radioButtons).map((el) => el.labels[0].textContent);

    expect(radioButtons.length).toBe(4);
    expect(labels).toEqual(['String', 'Reference', 'Number', 'Boolean']);
  });

  it('renders a radio button for JSON type if requested', () => {
    const { queryByLabelText } = render(
      h(AttributeTypeInput, {
        value: { type: 'string' },
        onChange: jest.fn(),
        showJsonTypeOption: true,
      })
    );

    const jsonRadioButton = queryByLabelText('JSON');
    expect(jsonRadioButton).not.toBeNull();
  });

  it('calls onChange callback when a type is selected', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      h(AttributeTypeInput, {
        value: { type: 'string' },
        onChange,
      })
    );

    fireEvent.click(getByLabelText('Number'));

    expect(onChange).toHaveBeenCalledWith({ type: 'number' });
  });

  describe('references', () => {
    it('renders an entity types menu for reference values', () => {
      const { getByLabelText } = render(
        h(AttributeTypeInput, {
          value: { type: 'reference', entityType: 'foo' },
          entityTypes: ['foo', 'bar', 'baz'],
          onChange: jest.fn(),
        })
      );

      const entityTypeInput = getByLabelText('Referenced entity type:');
      expect(entityTypeInput.getAttribute('role')).toBe('combobox');
    });

    it('selecting reference type uses the default reference entity type if one is provided', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeTypeInput, {
          value: { type: 'string' },
          entityTypes: ['foo', 'bar', 'baz'],
          defaultReferenceEntityType: 'baz',
          onChange,
        })
      );

      fireEvent.click(getByLabelText('Reference'));

      expect(onChange).toHaveBeenCalledWith({ type: 'reference', entityType: 'baz' });
    });

    it('selecting reference type uses the alphabetically first entity type if no default reference entity type is provided', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeTypeInput, {
          value: { type: 'string' },
          entityTypes: ['foo', 'bar', 'baz'],
          onChange,
        })
      );

      fireEvent.click(getByLabelText('Reference'));

      expect(onChange).toHaveBeenCalledWith({ type: 'reference', entityType: 'bar' });
    });
  });
});

describe('AttributeInput', () => {
  describe('type buttons', () => {
    it('renders radio buttons for available types', () => {
      const { getAllByRole } = render(
        h(AttributeInput, {
          onChange: jest.fn(),
        })
      );

      const radioButtons = getAllByRole('radio');
      const labels = Array.from(radioButtons).map((el) => el.labels[0].textContent);

      expect(radioButtons.length).toBe(4);
      expect(labels).toEqual(['String', 'Reference', 'Number', 'Boolean']);
    });

    it('renders an entity types menu for reference values', () => {
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: { entityType: 'foo', entityName: 'foo_1' },
          entityTypes: ['foo', 'bar', 'baz'],
          onChange: jest.fn(),
        })
      );

      const entityTypeInput = getByLabelText('Referenced entity type:');
      expect(entityTypeInput.getAttribute('role')).toBe('combobox');
    });

    it('renders a radio button for JSON type for JSON values', () => {
      const { queryByLabelText } = render(
        h(AttributeInput, {
          value: { key: 'value' },
          onChange: jest.fn(),
        })
      );

      const jsonRadioButton = queryByLabelText('JSON');
      expect(jsonRadioButton).not.toBeNull();
    });

    it('renders a radio button for JSON type if requested', () => {
      const { queryByLabelText } = render(
        h(AttributeInput, {
          onChange: jest.fn(),
          showJsonTypeOption: true,
        })
      );

      const jsonRadioButton = queryByLabelText('JSON');
      expect(jsonRadioButton).not.toBeNull();
    });
  });

  describe('selecting a type', () => {
    it('converts value to the selected type', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: '123',
          onChange,
        })
      );

      fireEvent.click(getByLabelText('Number'));

      expect(onChange).toHaveBeenCalledWith(123);
    });

    it('if an initial value is provided, converts initial value to the selected type', () => {
      // When editing an attribute, this allows previewing the effect of a type change without
      // performing the lossy conversion.
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: '123',
          initialValue: '456',
          onChange,
        })
      );

      fireEvent.click(getByLabelText('Number'));

      expect(onChange).toHaveBeenCalledWith(456);
    });
  });

  describe('renders a value input based on the attribute type', () => {
    it('renders a text input for string attributes', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: 'value',
          onChange,
        })
      );
      const valueInput = getByLabelText('New value');

      expect(valueInput.tagName).toBe('INPUT');
      expect(valueInput.type).toBe('text');
      expect(valueInput.value).toBe('value');

      fireEvent.change(valueInput, { target: { value: 'newvalue' } });
      expect(onChange).toHaveBeenCalledWith('newvalue');
    });

    it('renders a text input for reference attributes', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: { entityType: 'thing', entityName: 'thing_one' },
          onChange,
        })
      );
      const valueInput = getByLabelText('New value');

      expect(valueInput.tagName).toBe('INPUT');
      expect(valueInput.type).toBe('text');
      expect(valueInput.value).toBe('thing_one');

      fireEvent.change(valueInput, { target: { value: 'thing_two' } });
      expect(onChange).toHaveBeenCalledWith({ entityType: 'thing', entityName: 'thing_two' });
    });

    it('renders a number input for number attributes', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: 123,
          onChange,
        })
      );
      const valueInput = getByLabelText('New value');

      expect(valueInput.tagName).toBe('INPUT');
      expect(valueInput.type).toBe('number');
      expect(valueInput.value).toBe('123');

      fireEvent.change(valueInput, { target: { value: '456' } });
      expect(onChange).toHaveBeenCalledWith(456);
    });

    it('renders a switch for boolean attributes', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: true,
          onChange,
        })
      );
      const valueInput = getByLabelText('New value');

      expect(valueInput.tagName).toBe('INPUT');
      expect(valueInput.type).toBe('checkbox');
      expect(valueInput.checked).toBe(true);

      fireEvent.click(valueInput);
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  describe('lists', () => {
    it('renders a checkbox for list status', () => {
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange: jest.fn(),
        })
      );

      const listCheckbox = getByLabelText('Value is a list');
      expect(listCheckbox.getAttribute('role')).toBe('checkbox');
      expect(listCheckbox.getAttribute('aria-checked')).toBe('true');
    });

    it('it converts single value to a list when list checkbox is checked', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: 'foo',
          onChange,
        })
      );

      const listCheckbox = getByLabelText('Value is a list');
      fireEvent.click(listCheckbox);

      expect(onChange).toHaveBeenCalledWith({ itemsType: 'AttributeValue', items: ['foo'] });
    });

    it('it converts list to a single value when list checkbox is unchecked', () => {
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          value: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange,
        })
      );

      const listCheckbox = getByLabelText('Value is a list');
      fireEvent.click(listCheckbox);

      expect(onChange).toHaveBeenCalledWith('foo');
    });

    it('renders an input for each list item', () => {
      const onChange = jest.fn();
      const { getAllByLabelText } = render(
        h(AttributeInput, {
          value: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange,
        })
      );

      const valueInputs = getAllByLabelText(/^List value \d+/);
      expect(valueInputs.length).toBe(3);
      expect(Array.from(valueInputs).map((el) => el.value)).toEqual(['foo', 'bar', 'baz']);

      fireEvent.change(valueInputs[1], { target: { value: 'qux' } });
      expect(onChange).toHaveBeenCalledWith({ itemsType: 'AttributeValue', items: ['foo', 'qux', 'baz'] });
    });

    it('renders buttons to remove items from list', () => {
      const onChange = jest.fn();
      const { getAllByLabelText } = render(
        h(AttributeInput, {
          value: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange,
        })
      );

      const removeButtons = getAllByLabelText(/^Remove list value \d+/);
      expect(removeButtons.length).toBe(3);

      fireEvent.click(removeButtons[1]);
      expect(onChange).toHaveBeenCalledWith({ itemsType: 'AttributeValue', items: ['foo', 'baz'] });
    });

    it('renders button to add item to list', () => {
      const onChange = jest.fn();
      const { getByText } = render(
        h(AttributeInput, {
          value: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange,
        })
      );

      const addButton = getByText('Add item');
      fireEvent.click(addButton);

      expect(onChange).toHaveBeenCalledWith({ itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz', ''] });
    });
  });
});
