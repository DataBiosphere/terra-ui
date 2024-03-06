import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { renderWithTheme } from './internal/test-utils';
import { AsyncCreatableSelect, GroupedSelect, Select } from './Select';

describe('Select Component', () => {
  const options = [
    { value: 'foo', label: 'Foo' },
    { value: 'bar', label: 'Bar' },
  ];

  it('renders', () => {
    renderWithTheme(<Select options={options} value="foo" onChange={() => {}} />);
    expect(screen.getByText('Foo')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    renderWithTheme(<Select options={options} value="foo" onChange={mockOnChange} />);
    // Click on the select component and choose another option, confirm onChange is called
    await user.click(screen.getByText('Foo'));
    await user.click(screen.getByText('Bar'));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'bar', label: 'Bar' }),
      expect.anything()
    );
  });
});

describe('GroupedSelect Component', () => {
  const groupedOptions = [
    {
      label: 'Colors',
      options: [
        { value: 'blue', label: 'Blue' },
        { value: 'red', label: 'Red' },
      ],
    },
    { label: 'Size', options: [{ value: 'med', label: 'Medium' }] },
  ];

  it('renders', () => {
    renderWithTheme(<GroupedSelect options={groupedOptions} value="red" onChange={() => {}} />);
    expect(screen.getByText('Red')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup();

    const mockOnChange = jest.fn();
    renderWithTheme(<GroupedSelect options={groupedOptions} value="blue" onChange={mockOnChange} />);
    expect(screen.getByText('Blue')).toBeInTheDocument();
    await user.click(screen.getByText('Blue'));
    // Clicking the dropdown will show all the options which include the group name as well
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();

    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();

    // Choose another option, confirm onChange is called

    await user.click(screen.getByText('Medium'));
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'med' }), expect.anything());
  });
});

describe('AsyncCreatableSelect Component', () => {
  const options = [
    { value: 'car', label: 'Tesla' },
    { value: 'train', label: 'MBTA' },
  ];

  it('renders', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AsyncCreatableSelect options={options} value="car" onChange={() => {}} />);
    const selectComponent = screen.getByText('Select...');
    expect(selectComponent).toBeInTheDocument();
    await user.click(selectComponent);
    await user.paste('MBTA');
    expect(screen.getByDisplayValue('MBTA')).toBeInTheDocument();
  });
});
