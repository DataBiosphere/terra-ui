import { act, fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { TerraUserProfile } from 'src/libs/state';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { PersonalInfo } from './PersonalInfo';

// Workaround for import cycle.
jest.mock('src/auth/auth');

type SignOutExports = typeof import('src/auth/signout/sign-out');
jest.mock(
  'src/auth/signout/sign-out',
  (): Partial<SignOutExports> => ({
    signOut: jest.fn(),
    userSignedOut: jest.fn(),
  })
);

type UseProxyGroupExports = typeof import('./useProxyGroup');
jest.mock('./useProxyGroup', (): UseProxyGroupExports => {
  return {
    ...jest.requireActual<UseProxyGroupExports>('./useProxyGroup'),
    useProxyGroup: jest
      .fn()
      .mockReturnValue({ proxyGroup: { status: 'Ready', state: 'PROXY_abc123@dev.test.firecloud.org' } }),
  };
});

describe('PersonalInfo', () => {
  const mockProfile: TerraUserProfile = {
    firstName: 'Test',
    lastName: 'User',

    contactEmail: '',

    institute: 'Broad Institute',
    title: 'Automated Test',
    department: 'Data Sciences Platform',

    programLocationCity: 'Cambridge',
    programLocationState: 'MA',
    programLocationCountry: 'USA',

    researchArea: '',
    interestInTerra: '',

    starredWorkspaces: undefined,
  };

  it('renders the initial profile', () => {
    // Act
    const onSave = jest.fn().mockReturnValue(Promise.resolve());
    render(h(PersonalInfo, { initialProfile: mockProfile, onSave }));

    // Assert
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');

    const organizationInput = screen.getByLabelText('Organization');
    const titleInput = screen.getByLabelText('Title');
    const departmentInput = screen.getByLabelText('Department');

    const cityInput = screen.getByLabelText('City');
    const stateInput = screen.getByLabelText('State');
    const countryInput = screen.getByLabelText('Country');

    const contactEmailInput = screen.getByLabelText('Contact Email for Notifications (if different)');

    expect(firstNameInput).toHaveValue(mockProfile.firstName);
    expect(lastNameInput).toHaveValue(mockProfile.lastName);

    expect(organizationInput).toHaveValue(mockProfile.institute);
    expect(titleInput).toHaveValue(mockProfile.title);
    expect(departmentInput).toHaveValue(mockProfile.department);

    expect(cityInput).toHaveValue(mockProfile.programLocationCity);
    expect(stateInput).toHaveValue(mockProfile.programLocationState);
    expect(countryInput).toHaveValue(mockProfile.programLocationCountry);

    expect(contactEmailInput).toHaveValue(mockProfile.contactEmail);
  });

  it('calls onSave with the updated profile', () => {
    // Arrange
    const onSave = jest.fn().mockReturnValue(Promise.resolve());
    render(h(PersonalInfo, { initialProfile: mockProfile, onSave }));

    // Act
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');

    act(() => fireEvent.change(firstNameInput, { target: { value: 'Updated' } }));
    act(() => fireEvent.change(lastNameInput, { target: { value: 'Name' } }));

    const saveButton = screen.getByText('Save Profile');
    act(() => fireEvent.click(saveButton));

    // Assert
    expect(onSave).toHaveBeenCalledWith({
      ...mockProfile,
      firstName: 'Updated',
      lastName: 'Name',
    });
  });

  it("shows the user's proxy group", () => {
    // Arrange
    const onSave = jest.fn().mockReturnValue(Promise.resolve());
    render(h(PersonalInfo, { initialProfile: mockProfile, onSave }));

    // Assert
    screen.getByText('PROXY_abc123@dev.test.firecloud.org');
  });
});
