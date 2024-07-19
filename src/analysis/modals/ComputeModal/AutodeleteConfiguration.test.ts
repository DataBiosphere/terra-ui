import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';

import {
  AutodeleteConfiguration,
  AutodeleteConfigurationProps,
  autodeleteThresholds,
  getautodeleteThresholdLabel,
} from './AutodeleteConfiguration';

describe('AutodeleteConfiguration', () => {
  const setup = (props: Partial<AutodeleteConfigurationProps> = {}) => {
    render(
      h(AutodeleteConfiguration, {
        autodeleteRequired: false,
        autodeleteThreshold: 'Idle for 1 day(s)',
        onChangeAutodeleteThreshold: () => {},
        ...props,
      })
    );
  };

  it('renders a checkbox and dropdown for autodelete threshold', () => {
    // Act
    setup();

    // Assert
    const enableAutodeleteCheckbox = screen.getByRole('checkbox', { name: 'Enable autodelete' });
    expect(enableAutodeleteCheckbox).toBeChecked();

    const autodeleteThresholdInput = screen.getByRole('combobox');
    expect(autodeleteThresholdInput).toBeTruthy();
  });

  it('can disable both inputs', () => {
    // Act
    setup({ disabled: true });

    // Assert
    const enableAutodeleteCheckbox = screen.getByRole('checkbox', { name: 'Enable autodelete' });
    expect(enableAutodeleteCheckbox).toHaveAttribute('disabled');

    const autodeleteThresholdInput = screen.getByRole('combobox');
    expect(autodeleteThresholdInput).toBeDisabled();
  });

  it('can disable the option to disable autodelete', () => {
    // Act
    setup({ autodeleteRequired: true });

    // Assert
    const enableAutodeleteCheckbox = screen.getByRole('checkbox', { name: 'Enable autodelete' });
    expect(enableAutodeleteCheckbox).toHaveAttribute('disabled');

    const autodeleteThresholdInput = screen.getByRole('combobox');
    expect(autodeleteThresholdInput).toBeDisabled();
  });

  it('hides autodelete threshold dropdown when checkbox is unchecked', () => {
    // Arrange
    setup();

    // Act
    const enableAutodeleteCheckbox = screen.getByRole('checkbox', { name: 'Enable autodelete' });
    expect(enableAutodeleteCheckbox).toBeChecked();
    fireEvent.click(enableAutodeleteCheckbox);

    // Assert
    expect(enableAutodeleteCheckbox).not.toBeChecked();
    const autodeleteThresholdInput = screen.getByRole('combobox');
    expect(autodeleteThresholdInput).toBeDisabled();
  });

  it('renders a menu of autodelete thresholds', async () => {
    // Arrange
    const expectedOptions = Object.keys(autodeleteThresholds).map(getautodeleteThresholdLabel);
    const user = userEvent.setup();

    // Act
    setup();

    // Assert
    const select = new SelectHelper(screen.getByRole('combobox'), user);

    const options = await select.getOptions();
    expect(options).toEqual(expectedOptions);
  });

  it('calls onChangeAutodeleteThreshold when the threshold is changed', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChangeAutodeleteThreshold = jest.fn();
    setup({ onChangeAutodeleteThreshold });

    // Act
    const autodeleteThresholdInput = new SelectHelper(screen.getByRole('combobox'), user);
    expect(autodeleteThresholdInput).toBeDefined;
    await autodeleteThresholdInput.selectOption(getautodeleteThresholdLabel('Day_1'));

    // Assert
    expect(onChangeAutodeleteThreshold).toHaveBeenCalledWith('Day_1');
  });
});
