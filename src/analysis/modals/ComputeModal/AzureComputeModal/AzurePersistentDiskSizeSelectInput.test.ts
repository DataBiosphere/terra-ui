import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  AzurePersistentDiskSizeSelectInput,
  AzurePersistentDiskSizeSelectInputProps,
} from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzurePersistentDiskSizeSelectInput';
import { defaultAzureDiskSize } from 'src/libs/azure-utils';
import { renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';

const defaultAzurePersistentDiskSizeSelectInputProps: AzurePersistentDiskSizeSelectInputProps = {
  persistentDiskSize: defaultAzureDiskSize,
  onChangePersistentDiskSize: jest.fn(),
  persistentDiskExists: false,
};

describe('AzurePersistentDiskSizeSelectInput', () => {
  it('should render with default props', () => {
    // Arrange
    render(h(AzurePersistentDiskSizeSelectInput, defaultAzurePersistentDiskSizeSelectInputProps));

    // Assert
    expect(screen.getByLabelText('Disk Size (GB)')).toBeTruthy();
  });

  it('should call onChange when value is updated.', async () => {
    // Arrange
    render(h(AzurePersistentDiskSizeSelectInput, defaultAzurePersistentDiskSizeSelectInputProps));

    // Act
    await userEvent.click(screen.getByLabelText('Disk Size (GB)'));
    await userEvent.click(screen.getByText('1024'));

    // Assert
    expect(defaultAzurePersistentDiskSizeSelectInputProps.onChangePersistentDiskSize).toBeCalledWith(1024);
  });

  it('should be disabled when persistentDiskExists is true', () => {
    // Arrange
    render(
      h(AzurePersistentDiskSizeSelectInput, {
        ...defaultAzurePersistentDiskSizeSelectInputProps,
        persistentDiskExists: true,
      })
    );

    // Assert
    expect(screen.getByLabelText('Disk Size (GB)')).toBeDisabled();
    expect(screen.getByText(defaultAzureDiskSize)).toBeTruthy();
  });

  it('should show a disk size even if it is not in the list of default options.', () => {
    // Arrange
    render(
      h(AzurePersistentDiskSizeSelectInput, {
        ...defaultAzurePersistentDiskSizeSelectInputProps,
        persistentDiskSize: 30,
      })
    );

    // Assert
    expect(screen.findByText('30')).toBeTruthy();
  });

  it('shows default disk size options', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(h(AzurePersistentDiskSizeSelectInput, defaultAzurePersistentDiskSizeSelectInputProps));

    // Assert
    const input = screen.getByLabelText('Disk Size (GB)');
    const select = new SelectHelper(input, user);

    const options = await select.getOptions();
    expect(options).toEqual(['32', '64', '128', '256', '512', '1024', '2048', '4095']);
  });

  it('allows limiting max disk size', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      h(AzurePersistentDiskSizeSelectInput, {
        ...defaultAzurePersistentDiskSizeSelectInputProps,
        maxPersistentDiskSize: 128,
      })
    );

    // Assert
    const input = screen.getByLabelText('Disk Size (GB)');
    const select = new SelectHelper(input, user);

    const options = await select.getOptions();
    expect(options).toEqual(['32', '64', '128']);
  });
});
