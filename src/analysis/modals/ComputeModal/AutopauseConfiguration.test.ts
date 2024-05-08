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
});
