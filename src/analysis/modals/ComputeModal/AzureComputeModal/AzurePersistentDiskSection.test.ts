import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  AzurePersistentDiskSection,
  AzurePersistentDiskSectionProps,
} from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzurePersistentDiskSection';
import { defaultAzureDiskSize } from 'src/libs/azure-utils';

const defaultAzurePersistentDiskSectionProps: AzurePersistentDiskSectionProps = {
  persistentDiskType: {
    value: 'Standard_LRS',
    label: 'Standard HDD',
  },
  persistentDiskSize: defaultAzureDiskSize,
  onChangePersistentDiskType: jest.fn(),
  onChangePersistentDiskSize: jest.fn(),
  persistentDiskExists: false,
  onClickAbout: jest.fn(),
};

describe('AzurePersistentDiskSection', () => {
  it('should render with default props', () => {
    // Arrange
    render(h(AzurePersistentDiskSection, defaultAzurePersistentDiskSectionProps));
    // Assert
    expect(screen.getByLabelText('Disk Type')).toBeTruthy();
    expect(screen.getByLabelText('Disk Size (GB)')).toBeTruthy();
  });

  it('should call onChangePersistentDiskSize when updating size', async () => {
    // Arrange

    render(h(AzurePersistentDiskSection, defaultAzurePersistentDiskSectionProps));
    // Act
    const diskSizeInput = screen.getByLabelText('Disk Size (GB)');
    await userEvent.click(diskSizeInput);
    const newDiskSize = screen.getByText('1024');
    await userEvent.click(newDiskSize);
    // Assert
    expect(defaultAzurePersistentDiskSectionProps.onChangePersistentDiskSize).toHaveBeenCalledWith(1024);
  });

  it('should call onChangePersistentDiskType when updating type - same selection as previous.', async () => {
    // Arrange
    render(h(AzurePersistentDiskSection, defaultAzurePersistentDiskSectionProps));

    // Act
    const diskTypeSelect = screen.getByLabelText('Disk Type');
    await userEvent.click(diskTypeSelect);
    const standardHdd = screen.getByText('Standard HDD');
    await userEvent.click(standardHdd);
    // Assert
    expect(defaultAzurePersistentDiskSectionProps.onChangePersistentDiskType).toHaveBeenCalledWith('Standard_LRS');
  });

  it('should be disabled when persistentDiskExists is true', () => {
    // Arrange
    render(
      h(AzurePersistentDiskSection, {
        ...defaultAzurePersistentDiskSectionProps,
        persistentDiskExists: true,
      })
    );

    // Assert
    expect(screen.getByLabelText('Disk Type')).toBeDisabled();
    expect(screen.findByText('Standard HDD')).toBeTruthy();
    expect(screen.getByLabelText('Disk Size (GB)')).toBeDisabled();
  });

  it('should call onClickAbout when clicking the about link', async () => {
    // Arrange
    render(h(AzurePersistentDiskSection, defaultAzurePersistentDiskSectionProps));

    // Act
    const aboutLink = screen.getByText('Learn more about persistent disks and where your disk is mounted.');
    await userEvent.click(aboutLink);

    // Assert
    expect(defaultAzurePersistentDiskSectionProps.onClickAbout).toHaveBeenCalled();
  });
});
