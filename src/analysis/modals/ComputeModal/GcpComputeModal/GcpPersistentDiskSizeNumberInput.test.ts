import '@testing-library/dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  GcpPersistentDiskSizeNumberInput,
  GcpPersistentDiskSizeNumberInputProps,
} from 'src/analysis/modals/ComputeModal/GcpComputeModal/GcpPersistentDiskSizeNumberInput';

const defaultGcpPersistentDiskSizeNumberInput: GcpPersistentDiskSizeNumberInputProps = {
  persistentDiskSize: 64,
  onChangePersistentDiskSize: jest.fn(),
  isDisabled: false,
};

describe('GcpPersistentDiskSizeNumberInput', () => {
  it('should render with default props', () => {
    // Arrange
    render(h(GcpPersistentDiskSizeNumberInput, defaultGcpPersistentDiskSizeNumberInput));

    // Assert
    expect(screen.getByLabelText('Disk Size (GB)')).toBeTruthy();
  });

  it('should call onChange when value is updated.', async () => {
    // Arrange
    render(h(GcpPersistentDiskSizeNumberInput, defaultGcpPersistentDiskSizeNumberInput));
    // Act
    const diskSizeNumberInput = screen.getByLabelText('Disk Size (GB)');
    await userEvent.clear(diskSizeNumberInput);
    await userEvent.type(diskSizeNumberInput, '1024');

    // Assert
    expect(defaultGcpPersistentDiskSizeNumberInput.onChangePersistentDiskSize).toBeCalledWith(10);
    expect(defaultGcpPersistentDiskSizeNumberInput.onChangePersistentDiskSize).toBeCalledWith(102);
    expect(defaultGcpPersistentDiskSizeNumberInput.onChangePersistentDiskSize).toBeCalledWith(1024);
  });

  it('should be disabled when isDisabled is true', () => {
    // Arrange
    render(h(GcpPersistentDiskSizeNumberInput, { ...defaultGcpPersistentDiskSizeNumberInput, isDisabled: true }));

    // Assert
    expect(screen.getByLabelText('Disk Size (GB)')).toBeDisabled();
    expect(screen.getByLabelText('Disk Size (GB)')).toHaveValue(
      defaultGcpPersistentDiskSizeNumberInput.persistentDiskSize
    );
  });
});
