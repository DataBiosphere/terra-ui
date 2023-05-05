import '@testing-library/dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  GCPPersistentDiskSizeNumberInput,
  GCPPersistentDiskSizeNumberInputProps,
} from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/GCPPersistentDiskSizeNumberInput';

const defaultGCPPersistentDiskSizeNumberInput: GCPPersistentDiskSizeNumberInputProps = {
  persistentDiskSize: 64,
  onChangePersistentDiskSize: jest.fn(),
  isDisabled: false,
};

describe('GCPPersistentDiskSizeNumberInput', () => {
  it('should render with default props', () => {
    // Arrange
    render(h(GCPPersistentDiskSizeNumberInput, defaultGCPPersistentDiskSizeNumberInput));

    // Assert
    expect(screen.getByLabelText('Disk Size (GB)')).toBeTruthy();
  });

  it('should call onChange when value is updated.', async () => {
    // Arrange
    render(h(GCPPersistentDiskSizeNumberInput, defaultGCPPersistentDiskSizeNumberInput));
    // Act
    const diskSizeNumberInput = screen.getByLabelText('Disk Size (GB)');
    await userEvent.clear(diskSizeNumberInput);
    await userEvent.type(diskSizeNumberInput, '1024');

    // Assert
    expect(defaultGCPPersistentDiskSizeNumberInput.onChangePersistentDiskSize).toBeCalledWith(10);
    expect(defaultGCPPersistentDiskSizeNumberInput.onChangePersistentDiskSize).toBeCalledWith(102);
    expect(defaultGCPPersistentDiskSizeNumberInput.onChangePersistentDiskSize).toBeCalledWith(1024);
  });

  it('should be disabled when isDisabled is true', () => {
    // Arrange
    render(h(GCPPersistentDiskSizeNumberInput, { ...defaultGCPPersistentDiskSizeNumberInput, isDisabled: true }));

    // Assert
    expect(screen.getByLabelText('Disk Size (GB)')).toBeDisabled();
    expect(screen.getByLabelText('Disk Size (GB)')).toHaveValue(
      defaultGCPPersistentDiskSizeNumberInput.persistentDiskSize
    );
  });
});
