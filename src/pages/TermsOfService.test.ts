import { act, fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { Groups } from 'src/libs/ajax/Groups';
import { Metrics } from 'src/libs/ajax/Metrics';
import {
  SamUserRegistrationStatusResponse,
  SamUserTosComplianceStatusResponse,
  SamUserTosStatusResponse,
  User,
} from 'src/libs/ajax/User';
import { AuthState, authStore } from 'src/libs/state';
import TermsOfServicePage from 'src/pages/TermsOfService';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    goToPath: jest.fn(),
  })
);
type AuthExports = typeof import('src/auth/auth');
jest.mock(
  'src/auth/auth',
  (): AuthExports => ({
    ...jest.requireActual<AuthExports>('src/auth/auth'),
    signOut: jest.fn(),
  })
);

interface TermsOfServiceSetupResult {
  getTosFn: jest.Mock;
  getStatusFn: jest.Mock;
  getTermsOfServiceComplianceStatusFn: jest.Mock;
  acceptTosFn: jest.Mock;
  rejectTosFn: jest.Mock;
}

const setupMockAjax = async (
  termsOfService: SamUserTosComplianceStatusResponse
): Promise<TermsOfServiceSetupResult> => {
  const userSubjectId = 'testSubjectId';
  const userEmail = 'test@email.com';

  const getTos = jest.fn().mockResolvedValue('some text');
  const getTermsOfServiceComplianceStatus = jest
    .fn()
    .mockResolvedValue(termsOfService satisfies SamUserTosComplianceStatusResponse);
  const getStatus = jest.fn().mockResolvedValue({
    userSubjectId,
    userEmail,
    enabled: true,
  } satisfies SamUserRegistrationStatusResponse);
  const acceptTos = jest.fn().mockResolvedValue({
    userInfo: {
      userSubjectId,
      userEmail,
    },
    enabled: {
      ldap: true,
      allUsersGroup: true,
      google: true,
    },
  } satisfies SamUserTosStatusResponse);
  const rejectTos = jest.fn().mockResolvedValue({
    userInfo: {
      userSubjectId,
      userEmail,
    },
    enabled: {
      ldap: true,
      allUsersGroup: true,
      google: true,
    },
  } satisfies SamUserTosStatusResponse);
  const getFenceStatus = jest.fn();
  const getNihStatus = jest.fn();

  type AjaxContract = ReturnType<typeof Ajax>;
  type UserContract = ReturnType<typeof User>;
  type MetricsContract = ReturnType<typeof Metrics>;
  type GroupsContract = ReturnType<typeof Groups>;

  asMockedFn(Ajax).mockImplementation(
    () =>
      ({
        Metrics: {
          captureEvent: jest.fn(),
        } as Partial<MetricsContract>,
        User: {
          getUserAttributes: jest.fn().mockResolvedValue({ marketingConsent: true }),
          profile: {
            get: jest.fn().mockResolvedValue({ keyValuePairs: [] }),
            set: jest.fn().mockResolvedValue({ keyValuePairs: [] }),
            setPreferences: jest.fn().mockResolvedValue({}),
            preferLegacyFirecloud: jest.fn().mockResolvedValue({}),
          },
          getTos,
          getTermsOfServiceComplianceStatus,
          getStatus,
          acceptTos,
          rejectTos,
          getFenceStatus,
          getNihStatus,
        } as Partial<UserContract>,
        Groups: {
          list: jest.fn(),
        } as Partial<GroupsContract>,
      } as Partial<AjaxContract> as AjaxContract)
  );

  const signInStatus = 'signedIn';
  await act(async () => {
    authStore.update((state: AuthState) => ({ ...state, termsOfService, signInStatus }));
  });
  return Promise.resolve({
    getTosFn: getTos,
    getStatusFn: getStatus,
    getTermsOfServiceComplianceStatusFn: getTermsOfServiceComplianceStatus,
    acceptTosFn: acceptTos,
    rejectTosFn: rejectTos,
  });
};

describe('TermsOfService', () => {
  it('fetches the Terms of Service text from Sam', async () => {
    // Arrange
    const termsOfService = {
      userId: 'testUserId',
      userHasAcceptedLatestTos: true,
      permitsSystemUsage: true,
    };

    const { getTosFn } = await setupMockAjax(termsOfService);

    // Act
    await act(async () => {
      render(h(TermsOfServicePage));
    });

    // Assert
    expect(getTosFn).toHaveBeenCalled();

    screen.getByText('some text');
  });

  it('shows "Continue under grace period" when the user has not accepted the latest ToS but is still allowed to use Terra', async () => {
    // Arrange
    const termsOfService = {
      userId: 'testUserId',
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: true,
    };

    await setupMockAjax(termsOfService);

    // Act
    await act(async () => {
      render(h(TermsOfServicePage));
    });

    // Assert
    screen.getByText('Continue under grace period');
  });

  it('does not show "Continue under grace period" when the user has not accepted the latest ToS and is not allowed to use Terra', async () => {
    // Arrange
    const termsOfService = {
      userId: 'testUserId',
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: false,
    };
    await setupMockAjax(termsOfService);

    // Act
    await act(async () => {
      render(h(TermsOfServicePage));
    });

    // Assert
    const continueUnderGracePeriodButton = screen.queryByText('Continue under grace period');
    expect(continueUnderGracePeriodButton).toBeNull();
  });

  it('does not show any buttons when the user has accepted the latest ToS and is allowed to use Terra', async () => {
    // Arrange
    const termsOfService = {
      userId: 'testUserId',
      userHasAcceptedLatestTos: true,
      permitsSystemUsage: true,
    };

    await setupMockAjax(termsOfService);

    // Act
    await act(async () => {
      render(h(TermsOfServicePage));
    });

    // Assert
    const continueUnderGracePeriodButton = screen.queryByText('Continue under grace period');
    expect(continueUnderGracePeriodButton).not.toBeInTheDocument();

    const acceptButton = screen.queryByText('Accept');
    expect(acceptButton).toBeNull();
  });

  it('calls the acceptTos endpoint when the accept tos button is clicked', async () => {
    // Arrange
    const termsOfService = {
      userId: 'testUserId',
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: true,
    };

    const { acceptTosFn } = await setupMockAjax(termsOfService);

    // Act
    await act(async () => {
      render(h(TermsOfServicePage));
    });
    const acceptButton = screen.getByText('Accept');
    await act(async () => fireEvent.click(acceptButton));

    // Assert
    expect(acceptTosFn).toHaveBeenCalled();
  });

  it('calls the rejectTos endpoint when the reject tos button is clicked', async () => {
    // Arrange
    const termsOfService = {
      userId: 'testUserId',
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: false,
    };

    const { rejectTosFn } = await setupMockAjax(termsOfService);

    // Act
    await act(async () => {
      render(h(TermsOfServicePage));
    });
    const rejectButton = screen.getByText('Decline and Sign Out');
    await act(async () => fireEvent.click(rejectButton));

    // Assert
    expect(rejectTosFn).toHaveBeenCalled();
  });
});
