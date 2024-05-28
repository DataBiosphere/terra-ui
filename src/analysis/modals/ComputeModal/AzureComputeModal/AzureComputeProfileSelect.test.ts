import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { azureMachineTypes, defaultAzureMachineType, getMachineTypeLabel } from 'src/libs/azure-utils';
import { renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';

import { AzureComputeProfileSelect, AzureComputeProfileSelectProps } from './AzureComputeProfileSelect';

describe('AzureComputeProfileSelect', () => {
  const setup = (props: Partial<AzureComputeProfileSelectProps> = {}) => {
    render(
      h(AzureComputeProfileSelect, {
        machineType: defaultAzureMachineType,
        onChangeMachineType: () => {},
        ...props,
      })
    );
  };

  it('renders a menu of compute profiles', async () => {
    // Arrange
    const expectedOptions = Object.keys(azureMachineTypes).map(getMachineTypeLabel);
    const expectedSelectedOption = getMachineTypeLabel(defaultAzureMachineType);

    const user = userEvent.setup();

    // Act
    setup();

    // Assert
    const select = new SelectHelper(screen.getByLabelText('Cloud compute profile'), user);

    const options = await select.getOptions();
    expect(options).toEqual(expectedOptions);

    const [selectedOption] = await select.getSelectedOptions();
    expect(selectedOption).toEqual(expectedSelectedOption);
  });

  it('can provide a limited set of options', async () => {
    // Arrange
    const machineTypes = ['Standard_DS2_v2', 'Standard_DS3_v2'];
    const expectedOptions = machineTypes.map(getMachineTypeLabel);
    const expectedSelectedOption = getMachineTypeLabel(defaultAzureMachineType);

    const user = userEvent.setup();

    // Act
    setup({ machineTypeOptions: machineTypes });

    // Assert
    const select = new SelectHelper(screen.getByLabelText('Cloud compute profile'), user);

    const options = await select.getOptions();
    expect(options).toEqual(expectedOptions);

    const [selectedOption] = await select.getSelectedOptions();
    expect(selectedOption).toEqual(expectedSelectedOption);
  });

  it('calls onChangeMachineType when a profile is selected', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChangeMachineType = jest.fn();
    setup({ onChangeMachineType });
    const select = new SelectHelper(screen.getByLabelText('Cloud compute profile'), user);

    // Act
    await select.selectOption(getMachineTypeLabel('Standard_DS3_v2'));

    // Assert
    expect(onChangeMachineType).toHaveBeenCalledWith('Standard_DS3_v2');
  });
});
