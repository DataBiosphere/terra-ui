import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  GcpPersistentDiskSection,
  GcpPersistentDiskSectionProps,
} from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/GcpPersistentDiskSection';

const defaultGcpPersistentDiskSectionProps: GcpPersistentDiskSectionProps = {
  persistentDiskExists: false,
  persistentDiskSize: 50,
  persistentDiskType: {
    value: 'pd-standard',
    label: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice',
  },
  onChangePersistentDiskSize: jest.fn(),
  onChangePersistentDiskType: jest.fn(),
  onClickAbout: jest.fn(),
  cloudPlatform: 'GCP',
};

describe('GcpPersistentDiskSection', () => {
  it('should render with default props', () => {
    // Arrange
    render(h(GcpPersistentDiskSection, defaultGcpPersistentDiskSectionProps));

    // Assert
    expect(screen.getByLabelText('Disk Type')).toBeTruthy();
    expect(screen.getByLabelText('Disk Size (GB)')).toBeTruthy();
  });

  it('should call onChangePersistentDiskSize when updating size', async () => {
    // Arrange
    render(h(GcpPersistentDiskSection, defaultGcpPersistentDiskSectionProps));

    // Act
    const diskTypeInput = screen.getByLabelText('Disk Size (GB)');
    await userEvent.clear(diskTypeInput);
    await userEvent.type(diskTypeInput, '100');

    // Assert
    expect(defaultGcpPersistentDiskSectionProps.onChangePersistentDiskSize).toHaveBeenCalledWith(10);
    expect(defaultGcpPersistentDiskSectionProps.onChangePersistentDiskSize).toHaveBeenCalledWith(100);
  });

  it('should call onChangePersistentDiskType when updating type', async () => {
    // Arrange
    render(h(GcpPersistentDiskSection, defaultGcpPersistentDiskSectionProps));
    // Act
    const diskTypeSelect = screen.getByLabelText('Disk Type');
    await userEvent.click(diskTypeSelect);
    const balancedDiskType = screen.getByText('Balanced');
    await userEvent.click(balancedDiskType);

    // Assert
    expect(defaultGcpPersistentDiskSectionProps.onChangePersistentDiskType).toHaveBeenCalledWith({
      value: 'pd-balanced',
      label: 'Balanced',
      regionToPricesName: 'monthlyBalancedDiskPrice',
    });
  });

  it('should be disabled when persistentDiskExists is true', () => {
    // Arrange
    render(
      h(GcpPersistentDiskSection, {
        ...defaultGcpPersistentDiskSectionProps,
        persistentDiskExists: true,
      })
    );

    // Assert
    expect(screen.getByLabelText('Disk Type')).toBeDisabled();
    expect(screen.getByText('Standard')).toBeTruthy();
    expect(screen.getByLabelText('Disk Size (GB)')).toBeDisabled();
  });
});
