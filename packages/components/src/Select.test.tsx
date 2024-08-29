import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithTheme } from './internal/test-utils';
import { AsyncCreatableSelect, GroupedSelect, Select } from './Select';

describe('Select Component', () => {
  const options = [
    { value: 'foo', label: 'Foo' },
    { value: 'bar', label: 'Bar' },
  ];

  it('renders', () => {
    // Act
    renderWithTheme(<Select options={options} value='foo' onChange={() => {}} />);

    // Assert
    expect(screen.getByText('Foo')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    // Act
    renderWithTheme(<Select options={options} value='foo' onChange={mockOnChange} />);
    await user.click(screen.getByText('Foo'));
    await user.click(screen.getByText('Bar'));

    // Assert
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
    // Act
    renderWithTheme(<GroupedSelect options={groupedOptions} value='red' onChange={() => {}} />);

    // Assert
    expect(screen.getByText('Red')).toBeInTheDocument();
  });

  it('Ensure that all available options are displayed when the Select option is chosen', async () => {
    // Arrange
    const user = userEvent.setup();

    const mockOnChange = jest.fn();

    // Act
    renderWithTheme(<GroupedSelect options={groupedOptions} value='blue' onChange={mockOnChange} />);
    expect(screen.getByText('Blue')).toBeInTheDocument();
    await user.click(screen.getByText('Blue'));

    // Assert
    // Confirm dropdown will show all the options including the group name
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();

    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    // Arrange
    const user = userEvent.setup();

    const mockOnChange = jest.fn();

    // Act
    renderWithTheme(<GroupedSelect options={groupedOptions} value='red' onChange={mockOnChange} />);
    expect(screen.getByText('Red')).toBeInTheDocument();
    await user.click(screen.getByText('Red'));
    await user.click(screen.getByText('Medium'));

    // Assert
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'med' }), expect.anything());
  });
});

describe('AsyncCreatableSelect Component', () => {
  const options = [
    { value: 'car', label: 'Tesla' },
    { value: 'train', label: 'MBTA' },
  ];

  it('renders', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithTheme(
      <AsyncCreatableSelect<{ value: string; label?: string }> options={options} value={null} onChange={() => {}} />
    );

    // Act
    const selectComponent = screen.getByText('Select...');
    expect(selectComponent).toBeInTheDocument();
    await user.click(selectComponent);
    await user.paste('MBTA');

    // Assert
    expect(screen.getByDisplayValue('MBTA')).toBeInTheDocument();
  });
});
