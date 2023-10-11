import { fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { User } from 'src/libs/ajax/User';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import Register from './Register';

jest.mock('src/libs/ajax', () => ({
  ...jest.requireActual('src/libs/ajax'),
  Ajax: jest.fn(),
}));

jest.mock('src/libs/auth', () => ({
  ...jest.requireActual('src/libs/auth'),
  signOut: jest.fn(),
  refreshTerraProfile: jest.fn(),
}));

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

describe('Register', () => {
  it('requires Organization, Department, and Title if the checkbox is unchecked', async () => {
    // Arrange
    // Act
    const { container } = render(h(Register));
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Test Name' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Test Last Name' } });
    fireEvent.change(screen.getByLabelText(/Contact Email for Notifications/), {
      target: { value: 'testemail@noreply.com' },
    });
    // Assert
    const registerButton = screen.getByText('Register');
    // expect(registerButton).toBeDisabled doesn't seem to work.
    expect(registerButton).toHaveAttribute('disabled');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not require Organization, Department, and Title if the checkbox is checked', async () => {
    // Arrange
    // Act
    render(h(Register));
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Test Name' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Test Last Name' } });
    fireEvent.change(screen.getByLabelText(/Contact Email for Notifications/), {
      target: { value: 'testemail@noreply.com' },
    });
    fireEvent.click(screen.getByLabelText('I am not a part of an organization'));

    // Assert
    const registerButton = screen.getByText('Register');
    expect(registerButton).not.toHaveAttribute('disabled');
  });

  it('allows registration if Organization, Department, and Title are filled out', async () => {
    // Arrange
    // Act
    const { container } = render(h(Register));
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Test Name' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Test Last Name' } });
    fireEvent.change(screen.getByLabelText(/Contact Email for Notifications/), {
      target: { value: 'testemail@noreply.com' },
    });
    fireEvent.change(screen.getByLabelText(/Organization/), { target: { value: 'Test Organization' } });
    fireEvent.change(screen.getByLabelText(/Department/), { target: { value: 'Test Department' } });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Title' } });

    // Assert
    const registerButton = screen.getByText('Register');
    expect(registerButton).not.toHaveAttribute('disabled');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('fires off a request to Orch to register a user', async () => {
    // Arrange
    const profileSetFunction = jest.fn().mockReturnValue({});

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent: jest.fn() } as Partial<ReturnType<typeof Ajax>['Metrics']>,
          User: {
            profile: {
              set: profileSetFunction,
              get: jest.fn().mockReturnValue({}),
            } as Partial<ReturnType<typeof User>['profile']>,
          } as Partial<ReturnType<typeof Ajax>['User']>,
        } as ReturnType<typeof Ajax>)
    );

    // Act
    render(h(Register));

    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Test Name' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Test Last Name' } });
    fireEvent.change(screen.getByLabelText(/Contact Email for Notifications/), {
      target: { value: 'testemail@noreply.com' },
    });
    fireEvent.change(screen.getByLabelText(/Organization/), { target: { value: 'Test Organization' } });
    fireEvent.change(screen.getByLabelText(/Department/), { target: { value: 'Test Department' } });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Title' } });

    const registerButton = screen.getByText('Register');
    fireEvent.click(registerButton);

    // Assert
    expect(profileSetFunction).toHaveBeenCalledWith({
      firstName: 'Test Name',
      lastName: 'Test Last Name',
      contactEmail: 'testemail@noreply.com',
      title: 'Test Title',
      department: 'Test Department',
      institute: 'Test Organization',
      interestInTerra: '',
    });
  });
});
