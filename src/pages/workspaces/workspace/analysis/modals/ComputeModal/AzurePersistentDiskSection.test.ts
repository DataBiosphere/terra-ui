import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { defaultAzureDiskSize } from 'src/libs/azure-utils';
import {
  AzurePersistentDiskInput,
  AzurePersistentDiskInputProps,
} from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AzurePersistentDiskInput';

const defaultAzurePersistentDiskInputProps: AzurePersistentDiskInputProps = {
  persistentDiskType: {
    value: 'Standard_LRS',
    label: 'Standard HDD',
  },
  persistentDiskSize: defaultAzureDiskSize,
  onChangePersistentDiskType: jest.fn(),
  onChangePersistentDiskSize: jest.fn(),
  persistentDiskExists: false,
};

describe('AzurePersistentDiskInput', () => {
  it('should render with default props', () => {
    // Arrange
    render(h(AzurePersistentDiskInput, defaultAzurePersistentDiskInputProps));
    // Assert
    expect(screen.getByLabelText('Disk Type')).toBeTruthy();
    expect(screen.getByLabelText('Disk Size (GB)')).toBeTruthy();
  });

  it('should call onChangePersistentDiskSize when updating size', async () => {
    // Arrange

    render(h(AzurePersistentDiskInput, defaultAzurePersistentDiskInputProps));
    // Act
    const diskSizeInput = screen.getByLabelText('Disk Size (GB)');
    await userEvent.click(diskSizeInput);
    const newDiskSize = screen.getByText('1024');
    await userEvent.click(newDiskSize);
    // Assert
    expect(defaultAzurePersistentDiskInputProps.onChangePersistentDiskSize).toHaveBeenCalledWith(1024);
  });

  // it('should call onChangePersistentDiskType when updating type', async () => {
  //   // Arrange
  //   render(h(AzurePersistentDiskInput, defaultAzurePersistentDiskInputProps));

  //   // Act
  //   const diskTypeSelect = screen.getByLabelText('Disk Type');
  //   await userEvent.click(diskTypeSelect);
  //   const balancedDiskType = screen.getByText('Balanced');
  //   await userEvent.click(balancedDiskType);
  //   // Assert
  //   expect(defaultAzurePersistentDiskInputProps.onChangePersistentDiskType).toHaveBeenCalledWith('StandardSSD_LRS');
  // });

  it('should be disabled when persistentDiskExists is true', () => {
    // Arrange
    render(
      h(AzurePersistentDiskInput, {
        ...defaultAzurePersistentDiskInputProps,
        persistentDiskExists: true,
      })
    );

    // Assert
    expect(screen.getByLabelText('Disk Type')).toBeDisabled();
    expect(screen.findByText('Standard HDD')).toBeTruthy();
    expect(screen.getByLabelText('Disk Size (GB)')).toBeDisabled();
  });
});
