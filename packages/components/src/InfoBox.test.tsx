import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InfoBox } from './InfoBox';
import { renderWithTheme } from './internal/test-utils';

describe('InfoBox', () => {
  it('renders an icon button', async () => {
    // Act
    renderWithTheme(<InfoBox>More information about the thing.</InfoBox>);
    const trigger = screen.getByRole('button');

    // Assert
    expect(trigger).toHaveAccessibleName('More info');

    const icon = trigger.querySelector('svg')!;
    expect(icon).toHaveAttribute('data-icon', 'info-circle');
  });

  it('allows overriding the default icon', async () => {
    // Act
    renderWithTheme(<InfoBox icon='error-standard'>More information about the thing.</InfoBox>);
    const trigger = screen.getByRole('button');

    // Assert
    const icon = trigger.querySelector('svg')!;
    expect(icon).toHaveAttribute('data-icon', 'error-standard');
  });

  it('renders children in a dialog', async () => {
    // Arrange
    const user = userEvent.setup();

    renderWithTheme(<InfoBox>More information about the thing.</InfoBox>);

    // Act
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Assert
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('More information about the thing.');
  });
});
