import { act, fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { Groups } from 'src/libs/ajax/Groups';
import { Metrics } from 'src/libs/ajax/Metrics';
import { SamUserTermsOfServiceDetails, TermsOfService } from 'src/libs/ajax/TermsOfService';
import { User } from 'src/libs/ajax/User';
import { AuthState, authStore } from 'src/libs/state';
import { TermsOfServicePage } from 'src/registration/terms-of-service/TermsOfServicePage';
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
  getTermsOfServiceComplianceStatusFn: jest.Mock;
  acceptTosFn: jest.Mock;
  rejectTosFn: jest.Mock;
}

const setupMockAjax = async (termsOfService: SamUserTermsOfServiceDetails): Promise<TermsOfServiceSetupResult> => {
  const getTermsOfServiceText = jest.fn().mockResolvedValue('some text');
  const getUserTermsOfServiceDetails = jest
    .fn()
    .mockResolvedValue(termsOfService satisfies SamUserTermsOfServiceDetails);
  const acceptTermsOfService = jest.fn().mockResolvedValue(undefined);
  const rejectTermsOfService = jest.fn().mockResolvedValue(undefined);
  const getFenceStatus = jest.fn();
  const getNihStatus = jest.fn();

  type AjaxContract = ReturnType<typeof Ajax>;
  type UserContract = ReturnType<typeof User>;
  type MetricsContract = ReturnType<typeof Metrics>;
  type GroupsContract = ReturnType<typeof Groups>;
  type TermsOfServiceContract = ReturnType<typeof TermsOfService>;

  asMockedFn(Ajax).mockImplementation(
    () =>
      ({
        Metrics: {
          captureEvent: jest.fn(),
        } as Partial<MetricsContract>,
        User: {
          getUserAttributes: jest.fn().mockResolvedValue({ marketingConsent: true }),
          getUserAllowances: jest.fn().mockResolvedValue({
            allowed: termsOfService.permitsSystemUsage,
            details: { enabled: true, termsOfService: termsOfService.permitsSystemUsage },
          }),
          profile: {
            get: jest.fn().mockResolvedValue({ keyValuePairs: [] }),
            create: jest.fn().mockResolvedValue({ keyValuePairs: [] }),
            update: jest.fn().mockResolvedValue({ keyValuePairs: [] }),
            setPreferences: jest.fn().mockResolvedValue({}),
            preferLegacyFirecloud: jest.fn().mockResolvedValue({}),
          },
          getFenceStatus,
          getNihStatus,
        } as Partial<UserContract>,
        TermsOfService: {
          getUserTermsOfServiceDetails,
          acceptTermsOfService,
          rejectTermsOfService,
          getTermsOfServiceText,
        } as Partial<TermsOfServiceContract>,
        Groups: {
          list: jest.fn(),
        } as Partial<GroupsContract>,
      } as Partial<AjaxContract> as AjaxContract)
  );

  const signInStatus = 'authenticated';
  await act(async () => {
    authStore.update((state: AuthState) => ({ ...state, termsOfService, signInStatus }));
  });
  return Promise.resolve({
    getTosFn: getTermsOfServiceText,
    getTermsOfServiceComplianceStatusFn: getUserTermsOfServiceDetails,
    acceptTosFn: acceptTermsOfService,
    rejectTosFn: rejectTermsOfService,
  });
};

describe('TermsOfService', () => {
  it('fetches the Terms of Service text from Sam', async () => {
    // Arrange
    const termsOfService = {
      latestAcceptedVersion: '0',
      acceptedOn: new Date(),
      permitsSystemUsage: true,
      isCurrentVersion: true,
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
      latestAcceptedVersion: '0',
      acceptedOn: new Date(),
      permitsSystemUsage: true,
      isCurrentVersion: false,
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
      latestAcceptedVersion: '0',
      acceptedOn: new Date(),
      permitsSystemUsage: false,
      isCurrentVersion: false,
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
      latestAcceptedVersion: '0',
      acceptedOn: new Date(),
      permitsSystemUsage: true,
      isCurrentVersion: true,
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
      latestAcceptedVersion: '0',
      acceptedOn: new Date(),
      permitsSystemUsage: false,
      isCurrentVersion: false,
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
      latestAcceptedVersion: '0',
      acceptedOn: new Date(),
      permitsSystemUsage: false,
      isCurrentVersion: false,
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
