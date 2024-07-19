import { fireEvent } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import AttributeInput, { AttributeTypeInput } from './AttributeInput';

describe('AttributeTypeInput', () => {
  it('renders radio buttons for available types', () => {
    // Arrange
    const { getAllByRole } = render(
      h(AttributeTypeInput, {
        value: { type: 'string' },
        onChange: jest.fn(),
      })
    );
    // Assert
    const radioButtons = getAllByRole('radio');
    expect(radioButtons.length).toBe(4);

    const labels = Array.from(radioButtons).map((el) => {
      const inputElement = el as HTMLInputElement;
      return inputElement.labels ? inputElement.labels[0].textContent : '';
    });
    expect(labels).toEqual(['String', 'Reference', 'Number', 'Boolean']);
  });

  it('renders a radio button for JSON type if requested', () => {
    // Arrange
    const { queryByLabelText } = render(
      h(AttributeTypeInput, {
        value: { type: 'string' },
        onChange: jest.fn(),
        showJsonTypeOption: true,
      })
    );
    // Assert
    const jsonRadioButton = queryByLabelText('JSON');
    expect(jsonRadioButton).not.toBeNull();
  });

  it('calls onChange callback when a type is selected', () => {
    // Arrange
    const onChange = jest.fn();
    const { getByLabelText } = render(
      h(AttributeTypeInput, {
        value: { type: 'string' },
        onChange,
      })
    );

    // Act
    fireEvent.click(getByLabelText('Number'));
    // Assert
    expect(onChange).toHaveBeenCalledWith({ type: 'number' });
  });

  describe('references', () => {
    it('renders an entity types menu for reference values', () => {
      // Arrange
      const { getByLabelText } = render(
        h(AttributeTypeInput, {
          value: { type: 'reference', entityType: 'foo' },
          entityTypes: ['foo', 'bar', 'baz'],
          onChange: jest.fn(),
        })
      );
      // Assert
      const entityTypeInput = getByLabelText('Referenced entity type:');
      expect(entityTypeInput.getAttribute('role')).toBe('combobox');
    });

    it('selecting reference type uses the default reference entity type if one is provided', () => {
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeTypeInput, {
          value: { type: 'string' },
          entityTypes: ['foo', 'bar', 'baz'],
          defaultReferenceEntityType: 'baz',
          onChange,
        })
      );
      // Act
      fireEvent.click(getByLabelText('Reference'));
      // Assert
      expect(onChange).toHaveBeenCalledWith({ type: 'reference', entityType: 'baz' });
    });

    it('selecting reference type uses the alphabetically first entity type if no default reference entity type is provided', () => {
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeTypeInput, {
          value: { type: 'string' },
          entityTypes: ['foo', 'bar', 'baz'],
          onChange,
        })
      );
      // Act
      fireEvent.click(getByLabelText('Reference'));
      // Assert
      expect(onChange).toHaveBeenCalledWith({ type: 'reference', entityType: 'bar' });
    });
  });
});

describe('AttributeInput', () => {
  describe('type buttons', () => {
    it('renders radio buttons for available types', () => {
      // Arrange
      const { getAllByRole } = render(
        h(AttributeInput, {
          attributeValue: 'value',
          initialValue: 'value',
          entityTypes: [],
          onChange: jest.fn(),
        })
      );
      // Assert
      const radioButtons = getAllByRole('radio');
      expect(radioButtons.length).toBe(4);
      const labels: (string | null)[] = [];
      for (const el of radioButtons) {
        expect(el instanceof HTMLInputElement).toBe(true);
        const inputElement = el as HTMLInputElement;
        expect(inputElement.labels).not.toBeNull();
        expect(inputElement.labels![0]).not.toBeNull();
        expect(inputElement.labels![0] instanceof HTMLLabelElement).toBe(true);
        const label = inputElement.labels![0] as HTMLLabelElement;
        labels.push(label.textContent);
      }

      expect(labels).toEqual(['String', 'Reference', 'Number', 'Boolean']);
    });

    it('renders an entity types menu for reference values', () => {
      // Arrange
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: { entityType: 'foo', entityName: 'foo_1' },
          initialValue: { entityType: 'foo', entityName: 'foo_1' },
          entityTypes: ['foo', 'bar', 'baz'],
          onChange: jest.fn(),
        })
      );
      // Assert
      const entityTypeInput = getByLabelText('Referenced entity type:');
      expect(entityTypeInput.getAttribute('role')).toBe('combobox');
    });

    it('renders a radio button for JSON type for JSON values', () => {
      // Arrange
      const { queryByLabelText } = render(
        h(AttributeInput, {
          attributeValue: { key: 'value' },
          initialValue: { key: 'value' },
          entityTypes: [],
          onChange: jest.fn(),
        })
      );
      // Assert
      const jsonRadioButton = queryByLabelText('JSON');
      expect(jsonRadioButton).not.toBeNull();
    });

    it('renders a radio button for JSON type if requested', () => {
      // Arrange
      const { queryByLabelText } = render(
        h(AttributeInput, {
          onChange: jest.fn(),
          showJsonTypeOption: true,
          attributeValue: 'value',
          initialValue: 'value',
          entityTypes: [],
        })
      );
      // Assert
      const jsonRadioButton = queryByLabelText('JSON');
      expect(jsonRadioButton).not.toBeNull();
    });
  });

  describe('selecting a type', () => {
    it('converts value to the selected type', () => {
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: '123',
          initialValue: '123',
          onChange,
          entityTypes: [],
        })
      );
      // Act
      fireEvent.click(getByLabelText('Number'));
      // Assert
      expect(onChange).toHaveBeenCalledWith(123);
    });

    it('if an initial value is provided, converts initial value to the selected type', () => {
      // When editing an attribute, this allows previewing the effect of a type change without
      // performing the lossy conversion.
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: '123',
          initialValue: '456',
          onChange,
          entityTypes: [],
        })
      );
      // Act
      fireEvent.click(getByLabelText('Number'));
      // Assert
      expect(onChange).toHaveBeenCalledWith(456);
    });
  });

  describe('renders a value input based on the attribute type', () => {
    it('renders a text input for string attributes', () => {
      const onChange = jest.fn();
      // Arrange
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: 'value',
          initialValue: 'value',
          onChange,
          entityTypes: [],
        })
      );
      const valueInput = getByLabelText('New value');
      // Assert
      expect(valueInput.tagName).toBe('INPUT');
      expect(valueInput instanceof HTMLInputElement).toBe(true);
      expect((valueInput as HTMLInputElement).type).toBe('text');
      expect((valueInput as HTMLInputElement).value).toBe('value');
      // Act
      fireEvent.change(valueInput, { target: { value: 'newvalue' } });
      // Assert
      expect(onChange).toHaveBeenCalledWith('newvalue');
    });

    it('renders a text input for reference attributes', () => {
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: { entityType: 'thing', entityName: 'thing_one' },
          initialValue: { entityType: 'thing', entityName: 'thing_one' },
          onChange,
          entityTypes: ['thing'],
        })
      );
      const valueInput = getByLabelText('New value');
      // Assert
      expect(valueInput.tagName).toBe('INPUT');
      expect((valueInput as HTMLInputElement).type).toBe('text');
      expect((valueInput as HTMLInputElement).value).toBe('thing_one');
      // Act
      fireEvent.change(valueInput, { target: { value: 'thing_two' } });
      // Assert
      expect(onChange).toHaveBeenCalledWith({ entityType: 'thing', entityName: 'thing_two' });
    });

    it('renders a number input for number attributes', () => {
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: 123,
          initialValue: 123,
          onChange,
          entityTypes: [],
        })
      );
      const valueInput = getByLabelText('New value');
      // Assert
      expect(valueInput.tagName).toBe('INPUT');
      expect((valueInput as HTMLInputElement).type).toBe('number');
      expect((valueInput as HTMLInputElement).value).toBe('123');
      // Act
      fireEvent.change(valueInput, { target: { value: '456' } });
      // Assert
      expect(onChange).toHaveBeenCalledWith(456);
    });

    it('renders a switch for boolean attributes', () => {
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: true,
          initialValue: true,
          onChange,
          entityTypes: [],
        })
      );
      const valueInput = getByLabelText('New value');
      // Assert
      expect(valueInput.tagName).toBe('INPUT');
      expect((valueInput as HTMLInputElement).type).toBe('checkbox');
      expect((valueInput as HTMLInputElement).checked).toBe(true);
      // Act
      fireEvent.click(valueInput);
      // Assert
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  describe('lists', () => {
    it('renders a checkbox for list status', () => {
      // Arrange
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          initialValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange: jest.fn(),
          entityTypes: [],
        })
      );
      // Assert
      const listCheckbox = getByLabelText('Value is a list');
      expect(listCheckbox.getAttribute('role')).toBe('checkbox');
      expect(listCheckbox.getAttribute('aria-checked')).toBe('true');
    });

    it('it converts single value to a list when list checkbox is checked', () => {
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: 'foo',
          initialValue: 'foo',
          onChange,
          entityTypes: [],
        })
      );
      // Act
      const listCheckbox = getByLabelText('Value is a list');
      fireEvent.click(listCheckbox);
      // Assert
      expect(onChange).toHaveBeenCalledWith({ itemsType: 'AttributeValue', items: ['foo'] });
    });

    it('it converts list to a single value when list checkbox is unchecked', () => {
      // Arrange
      const onChange = jest.fn();
      const { getByLabelText } = render(
        h(AttributeInput, {
          attributeValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          initialValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange,
          entityTypes: [],
        })
      );
      // Act
      const listCheckbox = getByLabelText('Value is a list');
      fireEvent.click(listCheckbox);
      // Assert
      expect(onChange).toHaveBeenCalledWith('foo');
    });

    it('renders an input for each list item', () => {
      // Arrange
      const onChange = jest.fn();
      const { getAllByLabelText } = render(
        h(AttributeInput, {
          attributeValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          initialValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange,
          entityTypes: [],
        })
      );
      // Assert
      const valueInputs = getAllByLabelText(/^List value \d+/);
      expect(valueInputs.length).toBe(3);

      const labels: (string | null)[] = [];
      for (const el of valueInputs) {
        expect(el instanceof HTMLInputElement).toBe(true);
        const inputElement = el as HTMLInputElement;
        expect(inputElement.value).not.toBeNull();
        labels.push(inputElement.value);
      }

      expect(labels).toEqual(['foo', 'bar', 'baz']);
      // Act
      fireEvent.change(valueInputs[1], { target: { value: 'qux' } });
      // Assert
      expect(onChange).toHaveBeenCalledWith({ itemsType: 'AttributeValue', items: ['foo', 'qux', 'baz'] });
    });

    it('renders buttons to remove items from list', () => {
      const onChange = jest.fn();
      // Arrange
      const { getAllByLabelText } = render(
        h(AttributeInput, {
          attributeValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          initialValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange,
          entityTypes: [],
        })
      );
      // Assert
      const removeButtons = getAllByLabelText(/^Remove list value \d+/);
      expect(removeButtons.length).toBe(3);
      // Act
      fireEvent.click(removeButtons[1]);
      // Assert
      expect(onChange).toHaveBeenCalledWith({ itemsType: 'AttributeValue', items: ['foo', 'baz'] });
    });

    it('renders button to add item to list', () => {
      const onChange = jest.fn();
      // Arrange
      const { getByText } = render(
        h(AttributeInput, {
          attributeValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          initialValue: { itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz'] },
          onChange,
          entityTypes: [],
        })
      );
      // Act
      const addButton = getByText('Add item');
      fireEvent.click(addButton);
      // Assert
      expect(onChange).toHaveBeenCalledWith({ itemsType: 'AttributeValue', items: ['foo', 'bar', 'baz', ''] });
    });
  });
});
