import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  PersistentDiskTypeInput,
  PersistentDiskTypeInputProps,
} from 'src/analysis/modals/ComputeModal/PersistentDiskTypeInput';

const defaultPersistentDiskTypeInputProps: PersistentDiskTypeInputProps = {
  value: {
    value: 'pd-standard',
    label: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice',
  },
  onChange: jest.fn(),
  isDisabled: false,
  options: [
    {
      value: {
        value: 'pd-standard',
        label: 'Standard',
        regionToPricesName: 'monthlyStandardDiskPrice',
      },
      label: 'Standard',
    },
    {
      value: {
        value: 'pd-balanced',
        label: 'Balanced',
        regionToPricesName: 'monthlyBalancedDiskPrice',
      },
      label: 'Balanced',
    },
  ],
};

describe('PersistentDiskTypeInput', () => {
  it('should render with default value selected.', () => {
    // Arrange
    render(h(PersistentDiskTypeInput, defaultPersistentDiskTypeInputProps));

    // Assert
    screen.getByText('Standard');
  });

  it('should call onChange when value is updated.', async () => {
    // Arrange
    const user = userEvent.setup();
    render(h(PersistentDiskTypeInput, defaultPersistentDiskTypeInputProps));

    // Act
    const diskTypeSelect = screen.getByLabelText('Disk Type');
    await user.click(diskTypeSelect);
    const balancedDiskType = screen.getByText('Balanced');
    await user.click(balancedDiskType);

    // Assert
    expect(screen.findByText('Balanced')).toBeTruthy();
    expect(defaultPersistentDiskTypeInputProps.onChange).toBeCalledWith({
      value: {
        value: 'pd-balanced',
        label: 'Balanced',
        regionToPricesName: 'monthlyBalancedDiskPrice',
      },
      label: 'Balanced',
    });
  });

  it('should be disabled when isDisabled is true.', () => {
    // Arrange
    render(h(PersistentDiskTypeInput, { ...defaultPersistentDiskTypeInputProps, isDisabled: true }));

    // Act
    const diskTypeSelect = screen.getByLabelText('Disk Type');

    // Assert
    expect(diskTypeSelect).toBeDisabled();
    screen.getByText('Standard');
  });
});
