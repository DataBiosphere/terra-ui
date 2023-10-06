import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { authStore } from 'src/libs/state';
import TermsOfServicePage from 'src/pages/TermsOfService';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

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
type AuthExports = typeof import('src/libs/auth');
jest.mock(
  'src/libs/auth',
  (): AuthExports => ({
    ...jest.requireActual('src/libs/auth'),
    signOut: jest.fn(),
  })
);

const setupMockAjax = (termsOfService) => {
  const getTos = jest.fn().mockReturnValue(Promise.resolve('some text'));
  const getTermsOfServiceComplianceStatus = jest.fn().mockReturnValue(Promise.resolve(termsOfService));
  const getStatus = jest.fn().mockReturnValue(Promise.resolve({}));
  const acceptTos = jest.fn().mockReturnValue(Promise.resolve({ enabled: true }));
  const rejectTos = jest.fn().mockReturnValue(Promise.resolve({ enabled: true }));
  const getFenceStatus = jest.fn();
  const getNihStatus = jest.fn();

  asMockedFn(Ajax).mockImplementation(() => ({
    Metrics: {
      captureEvent: jest.fn(),
    },
    User: {
      profile: {
        get: jest.fn().mockReturnValue(Promise.resolve({ keyValuePairs: [] })),
      },
      getTos,
      getTermsOfServiceComplianceStatus,
      getStatus,
      acceptTos,
      rejectTos,
      getFenceStatus,
      getNihStatus,
    },
    Groups: {
      list: jest.fn(),
    },
  }));

  const signInStatus = 'signedIn';
  authStore.update((state) => ({ ...state, termsOfService, signInStatus }));
  return {
    getTosFn: getTos,
    getStatusFn: getStatus,
    getTermsOfServiceComplianceStatusFn: getTermsOfServiceComplianceStatus,
    acceptTosFn: acceptTos,
    rejectTosFn: rejectTos,
  };
};

describe('TermsOfService', () => {
  afterEach(() => {
    authStore.reset();
  });
  it('fetches the Terms of Service text from Sam', async () => {
    // Arrange
    const termsOfService = {
      userHasAcceptedLatestTos: true,
      permitsSystemUsage: true,
    };

    const { getTosFn } = setupMockAjax(termsOfService);

    // Act
    await act(async () => { render(h(TermsOfServicePage)) }) //eslint-disable-line

    // Assert
    expect(getTosFn).toHaveBeenCalled();

    screen.getByText('some text');
  });

  it('shows "Continue under grace period" when the user has not accepted the latest ToS but is still allowed to use Terra', async () => {
    // Arrange
    const termsOfService = {
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: true,
    };

    setupMockAjax(termsOfService);

    // Act
    await act(async () => { render(h(TermsOfServicePage)) }) //eslint-disable-line

    // Assert
    const gracePeriodButton = screen.getByText('Continue under grace period');
    expect(gracePeriodButton).toBeInTheDocument();
  });

  it('does not show "Continue under grace period" when the user has not accepted the latest ToS and is not allowed to use Terra', async () => {
    // Arrange
    const termsOfService = {
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: false,
    };
    setupMockAjax(termsOfService);

    // Act
    await act(async () => { render(h(TermsOfServicePage)) }) //eslint-disable-line

    // Assert
    const continueUnderGracePeriodButton = screen.queryByText('Continue under grace period');
    expect(continueUnderGracePeriodButton).not.toBeInTheDocument();
  });

  it('does not show any buttons when the user has accepted the latest ToS and is allowed to use Terra', async () => {
    // Arrange
    const termsOfService = {
      userHasAcceptedLatestTos: true,
      permitsSystemUsage: true,
    };

    setupMockAjax(termsOfService);

    // Act
    await act(async () => { render(h(TermsOfServicePage)) }) //eslint-disable-line

    // Assert
    const continueUnderGracePeriodButton = screen.queryByText('Continue under grace period');
    expect(continueUnderGracePeriodButton).not.toBeInTheDocument();

    const acceptButton = screen.queryByText('Accept');
    expect(acceptButton).not.toBeInTheDocument();
  });
  it('calls the acceptTos endpoint when the accept tos button is clicked', async () => {
    // Arrange
    const termsOfService = {
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: true,
    };

    const { acceptTosFn } = setupMockAjax(termsOfService);

    // Act
    await act(async () => { render(h(TermsOfServicePage)) }) //eslint-disable-line

    // Assert
    const acceptButton = screen.getByText('Accept');
    await act(async () => fireEvent.click(acceptButton));
    expect(acceptTosFn).toHaveBeenCalled();
  });

  it('calls the rejectTos endpoint when the reject tos button is clicked', async () => {
    // Arrange
    const termsOfService = {
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: false,
    };

    const { rejectTosFn } = setupMockAjax(termsOfService);

    // Act
    await act(async () => { render(h(TermsOfServicePage)) }) //eslint-disable-line

    // Assert
    const rejectButton = screen.getByText('Decline and Sign Out');
    await act(async () => fireEvent.click(rejectButton));
    expect(rejectTosFn).toHaveBeenCalled();
  });
});
