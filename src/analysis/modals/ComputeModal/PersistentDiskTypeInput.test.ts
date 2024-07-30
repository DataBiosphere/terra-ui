import { GoogleDiskType } from '@terra-ui-packages/leonardo-data-client';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  PersistentDiskTypeInput,
  PersistentDiskTypeInputProps,
} from 'src/analysis/modals/ComputeModal/PersistentDiskTypeInput';
import { GooglePdType } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

const defaultPersistentDiskTypeInputProps: PersistentDiskTypeInputProps<GoogleDiskType, GooglePdType> = {
  value: 'pd-standard',
  onChange: jest.fn(),
  isDisabled: false,
  options: [
    {
      value: 'pd-standard',
      label: 'Standard',
      regionToPricesName: 'monthlyStandardDiskPrice',
    },
    {
      value: 'pd-balanced',
      label: 'Balanced',
      regionToPricesName: 'monthlyBalancedDiskPrice',
    },
  ],
};

describe('PersistentDiskTypeInput', () => {
  it('should render with default value selected.', () => {
    // Arrange
    render(h(PersistentDiskTypeInput<GoogleDiskType, GooglePdType>, defaultPersistentDiskTypeInputProps));

    // Assert
    screen.getByText('Standard');
  });

  it('should call onChange when value is updated.', async () => {
    // Arrange
    const user = userEvent.setup();
    render(h(PersistentDiskTypeInput<GoogleDiskType, GooglePdType>, defaultPersistentDiskTypeInputProps));

    // Act
    const diskTypeSelect = screen.getByLabelText('Disk Type');
    await user.click(diskTypeSelect);
    const balancedDiskType = screen.getByText('Balanced');
    await user.click(balancedDiskType);

    // Assert
    expect(screen.findByText('Balanced')).toBeTruthy();
    expect(defaultPersistentDiskTypeInputProps.onChange).toHaveBeenCalledWith({
      value: 'pd-balanced',
      label: 'Balanced',
      regionToPricesName: 'monthlyBalancedDiskPrice',
    });
  });

  it('should be disabled when isDisabled is true.', () => {
    // Arrange
    render(
      h(PersistentDiskTypeInput<GoogleDiskType, GooglePdType>, {
        ...defaultPersistentDiskTypeInputProps,
        isDisabled: true,
      })
    );

    // Act
    const diskTypeSelect = screen.getByLabelText('Disk Type');

    // Assert
    expect(diskTypeSelect).toBeDisabled();
    screen.getByText('Standard');
  });
});
