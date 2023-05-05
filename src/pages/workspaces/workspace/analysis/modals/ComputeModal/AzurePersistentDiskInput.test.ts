import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  AzurePersistentDiskInput,
  AzurePersistentDiskInputProps,
} from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AzurePersistentDiskInput';

const defaultAzurePersistentDiskInputProps: AzurePersistentDiskInputProps = {
  persistentDiskType: {
    value: 'Standard_LRS',
    label: 'Standard HDD',
  },
  persistentDiskSize: 0,
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

  it('should call onChangePersistentDiskSize when value is updated.', async () => {
    // Arrange
    render(h(AzurePersistentDiskInput, defaultAzurePersistentDiskInputProps));
    // Act
    const diskSizeSelect = screen.getByLabelText('Disk Size (GB)');
    await userEvent.click(diskSizeSelect);
    const diskSize1024 = screen.getByText('1024');
    await userEvent.click(diskSize1024);
    // Assert
    expect(defaultAzurePersistentDiskInputProps.onChangePersistentDiskSize).toBeCalledWith(1024);
  });

  // TODO: Disabled until SSD costs are available, and SSD is tested.
  // it('should call onChangePersistentDiskType when value is updated.', async () => {
  //   // Arrange
  //   render(h(AzurePersistentDiskInput, defaultAzurePersistentDiskInputProps));
  //   // Act
  //   const diskTypeSelect = screen.getByLabelText('Disk Type');
  //   await userEvent.click(diskTypeSelect);
  //   const standardSSDDiskType = screen.getByText('Standard SSD');
  //   await userEvent.click(standardSSDDiskType);
  //   // Assert
  //   expect(defaultAzurePersistentDiskInputProps.onChangePersistentDiskType).toBeCalledWith({
  //     value: 'StandardSSD_LRS',
  //     label: 'Standard SSD',
  //   });
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
