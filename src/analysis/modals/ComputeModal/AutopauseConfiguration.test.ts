import { fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { defaultAutopauseThreshold } from 'src/analysis/utils/runtime-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { AutopauseConfiguration, AutopauseConfigurationProps } from './AutopauseConfiguration';

describe('AutopauseConfiguration', () => {
  const setup = (props: Partial<AutopauseConfigurationProps> = {}) => {
    render(
      h(AutopauseConfiguration, {
        autopauseThreshold: defaultAutopauseThreshold,
        onChangeAutopauseThreshold: () => {},
        ...props,
      })
    );
  };

  it('renders a checkbox and input for autopause threshold', () => {
    // Act
    setup();

    // Assert
    const enableAutopauseCheckbox = screen.getByRole('checkbox', { name: 'Enable autopause' });
    expect(enableAutopauseCheckbox).toBeChecked();

    const autopauseThresholdInput = screen.getByRole('spinbutton', {
      name: 'Minutes of inactivity before autopausing',
    });
    expect(autopauseThresholdInput).toHaveValue(defaultAutopauseThreshold);
  });

  it('can disable both inputs', () => {
    // Act
    setup({ disabled: true });

    // Assert
    const enableAutopauseCheckbox = screen.getByRole('checkbox', { name: 'Enable autopause' });
    expect(enableAutopauseCheckbox).toHaveAttribute('disabled');

    const autopauseThresholdInput = screen.getByRole('spinbutton', {
      name: 'Minutes of inactivity before autopausing',
    });
    expect(autopauseThresholdInput).toBeDisabled();
  });

  it('can disable the option to disable autopause', () => {
    // Act
    setup({ autopauseRequired: true });

    // Assert
    const enableAutopauseCheckbox = screen.getByRole('checkbox', { name: 'Enable autopause' });
    expect(enableAutopauseCheckbox).toHaveAttribute('disabled');

    const autopauseThresholdInput = screen.getByRole('spinbutton', {
      name: 'Minutes of inactivity before autopausing',
    });
    expect(autopauseThresholdInput).not.toBeDisabled();
  });

  it('sets default min and max values', () => {
    // Act
    setup();

    // Assert
    const autopauseThresholdInput = screen.getByRole('spinbutton', {
      name: 'Minutes of inactivity before autopausing',
    });

    expect(autopauseThresholdInput).toHaveAttribute('min', '10');
    expect(autopauseThresholdInput).toHaveAttribute('max', '999');
  });

  it('allows configuring min and max values', () => {
    // Act
    setup({ minThreshold: 15, maxThreshold: 30 });

    // Assert
    const autopauseThresholdInput = screen.getByRole('spinbutton', {
      name: 'Minutes of inactivity before autopausing',
    });

    expect(autopauseThresholdInput).toHaveAttribute('min', '15');
    expect(autopauseThresholdInput).toHaveAttribute('max', '30');
  });

  it('calls onChangeAutopauseThreshold when the threshold is changed', () => {
    // Arrange
    const onChangeAutopauseThreshold = jest.fn();
    setup({ onChangeAutopauseThreshold });

    // Act
    const autopauseThresholdInput = screen.getByRole('spinbutton', {
      name: 'Minutes of inactivity before autopausing',
    });
    fireEvent.change(autopauseThresholdInput, { target: { value: '15' } });

    // Assert
    expect(onChangeAutopauseThreshold).toHaveBeenCalledWith(15);
  });

  it('clears autopause threshold when checkbox is unchecked', () => {
    // Arrange
    const onChangeAutopauseThreshold = jest.fn();
    setup({ onChangeAutopauseThreshold });

    // Act
    const enableAutopauseCheckbox = screen.getByRole('checkbox', { name: 'Enable autopause' });
    fireEvent.click(enableAutopauseCheckbox);

    // Assert
    expect(onChangeAutopauseThreshold).toHaveBeenCalledWith(0);
  });

  it('sets default autopause threshold when checkbox is checked', () => {
    // Arrange
    const onChangeAutopauseThreshold = jest.fn();
    setup({ autopauseThreshold: 0, onChangeAutopauseThreshold });

    // Assert
    const enableAutopauseCheckbox = screen.getByRole('checkbox', { name: 'Enable autopause' });
    expect(enableAutopauseCheckbox).not.toBeChecked();

    // Act
    fireEvent.click(enableAutopauseCheckbox);

    // Assert
    expect(onChangeAutopauseThreshold).toHaveBeenCalledWith(defaultAutopauseThreshold);
  });

  it('shows a message describing minimum threshold', () => {
    // Arrange/Act
    setup();

    // Assert
    screen.getByText('Choose a duration of 10 minutes or more.');
  });

  it('shows a message describing minimum/maximum threshold', () => {
    // Arrange/Act
    setup({ minThreshold: 10, maxThreshold: 30 });

    // Assert
    screen.getByText('Choose a duration between 10 and 30 minutes.');
  });
});
