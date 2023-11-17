import { act, fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { Register } from './Register';

jest.mock('src/libs/ajax');

jest.mock('src/auth/auth', () => ({
  ...jest.requireActual('src/auth/auth'),
  signOut: jest.fn(),
}));

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

type AjaxContract = ReturnType<typeof Ajax>;
type MetricsPartial = Partial<AjaxContract['Metrics']>;
type UserPartial = Partial<AjaxContract['User']>;
type ProfilePartial = Partial<UserPartial['profile']>;
type TermsOfServicePartial = Partial<AjaxContract['TermsOfService']>;

const fillInPersonalInfo = (): void => {
  fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Test Name' } });
  fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Test Last Name' } });
  fireEvent.change(screen.getByLabelText(/Contact Email for Notifications/), {
    target: { value: 'ltcommanderdata@neighborhood.horse' },
  });
};
const fillInOrgInfo = (): void => {
  fireEvent.change(screen.getByLabelText(/Organization/), { target: { value: 'Test Organization' } });
  fireEvent.change(screen.getByLabelText(/Department/), { target: { value: 'Test Department' } });
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Title' } });
};
const acceptTermsOfService = (): void => {
  asMockedFn(Ajax).mockImplementation(
    () =>
      ({
        TermsOfService: {
          getTermsOfServiceText: jest.fn().mockResolvedValue('Terra Terms of Service'),
        } as TermsOfServicePartial,
      } as AjaxContract)
  );

  fireEvent.click(screen.getByText('Read Terra Platform Terms of Service here'));

  fireEvent.click(screen.getByText('OK'));
  fireEvent.click(screen.getByLabelText('By checking this box, you are agreeing to the Terra Terms of Service'));
};

describe('Register', () => {
  it('requires Organization, Department, and Title if the checkbox is unchecked', async () => {
    // Arrange
    // Act
    const { container } = render(h(Register));
    fillInPersonalInfo();

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
    fillInPersonalInfo();
    fireEvent.click(screen.getByLabelText('I am not a part of an organization'));
    acceptTermsOfService();

    // Assert
    const registerButton = screen.getByText('Register');
    expect(registerButton).not.toHaveAttribute('disabled');
  });

  it('allows registration if Organization, Department, and Title are filled out', async () => {
    // Arrange
    // Act
    const { container } = render(h(Register));
    fillInPersonalInfo();
    fillInOrgInfo();
    acceptTermsOfService();

    // Assert
    const registerButton = screen.getByText('Register');
    expect(registerButton).not.toHaveAttribute('disabled');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('defaults the marketing communications checkbox to true', async () => {
    // Arrange
    // Act
    render(h(Register));
    // Assert
    const commsCheckbox = screen.getByLabelText(/Marketing communications.*/);
    expect(commsCheckbox.getAttribute('aria-checked')).toBe('true');
  });

  it('fires off a request to Orch and Sam to register a user', async () => {
    // Arrange
    const registerUserFunction = jest.fn().mockResolvedValue({});
    const setUserAttributesFunction = jest.fn().mockResolvedValue({ marketingConsent: false });
    const getUserAttributesFunction = jest.fn().mockResolvedValue({ marketingConsent: false });

    // Act
    render(h(Register));

    fillInPersonalInfo();
    fillInOrgInfo();
    fireEvent.click(screen.getByLabelText(/Marketing communications.*/));
    acceptTermsOfService();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent: jest.fn() } as MetricsPartial,
          User: {
            setUserAttributes: setUserAttributesFunction,
            getUserAttributes: getUserAttributesFunction,
            registerWithProfile: registerUserFunction,
            profile: {
              get: jest.fn().mockReturnValue({}),
            } as ProfilePartial,
          } as UserPartial,
        } as AjaxContract)
    );

    const registerButton = screen.getByText('Register');
    expect(registerButton).not.toHaveAttribute('disabled');
    await act(() => fireEvent.click(registerButton));

    // Assert
    expect(registerUserFunction).toHaveBeenCalledWith(true, {
      firstName: 'Test Name',
      lastName: 'Test Last Name',
      contactEmail: 'ltcommanderdata@neighborhood.horse',
      title: 'Test Title',
      department: 'Test Department',
      institute: 'Test Organization',
      interestInTerra: '',
    });

    expect(setUserAttributesFunction).toHaveBeenCalledWith({ marketingConsent: false });
    expect(getUserAttributesFunction).toHaveBeenCalled();
  });
});
