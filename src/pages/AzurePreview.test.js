import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { signOut } from 'src/libs/auth';
import { azurePreviewStore } from 'src/libs/state';

import AzurePreview from './AzurePreview';

jest.mock('src/libs/auth', () => ({
  ...jest.requireActual('src/libs/auth'),
  signOut: jest.fn(),
}));

describe('for preview users', () => {
  it('renders a button to proceed to Terra', async () => {
    // Arrange
    const user = userEvent.setup();

    jest.spyOn(azurePreviewStore, 'set');

    // Act
    render(h(AzurePreview));

    const proceedToTerraButton = screen.getByText('Proceed to Terra on Microsoft Azure Preview');
    await user.click(proceedToTerraButton);

    // Assert
    expect(azurePreviewStore.set).toHaveBeenCalledWith(true);
  });

  it('renders a sign out button', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(h(AzurePreview));

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    // Assert
    expect(signOut).toHaveBeenCalled();
  });
});
