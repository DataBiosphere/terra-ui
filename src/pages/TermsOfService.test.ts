import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { authStore, SignInStatus, TermsOfServiceStatus } from 'src/libs/state';
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

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxMetricsContract = AjaxContract['Metrics'];
type AjaxUserContract = AjaxContract['User'];

const setupMockAjax = (termsOfService: TermsOfServiceStatus) => {
  const getTos = jest.fn().mockReturnValue(Promise.resolve('some text'));
  const getTermsOfServiceComplianceStatus = jest.fn().mockReturnValue(Promise.resolve(termsOfService));
  const getStatus = jest.fn().mockReturnValue(Promise.resolve({}));
  const mockMetrics: Partial<AjaxMetricsContract> = {
    captureEvent: jest.fn(),
  };
  const mockUser: Partial<AjaxUserContract> = {
    profile: {
      get: jest.fn().mockReturnValue(Promise.resolve({ keyValuePairs: [] })),
      set: jest.fn(),
      setPreferences: jest.fn(),
      preferLegacyFirecloud: jest.fn(),
    },
    getTos,
    getTermsOfServiceComplianceStatus,
    getStatus,
  };
  const mockAjax: Partial<AjaxContract> = {
    Metrics: mockMetrics as AjaxMetricsContract,
    User: mockUser as AjaxUserContract,
  };
  asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

  const signInStatus: SignInStatus = 'signedIn';
  authStore.update((state) => ({ ...state, termsOfService, signInStatus }));
  return {
    getTosFn: getTos,
    getStatusFn: getStatus,
    getTermsOfServiceComplianceStatusFn: getTermsOfServiceComplianceStatus,
  };
};

describe('TermsOfService', () => {
  afterEach(() => {
    authStore.reset();
  });
  it('fetches the Terms of Service text from Sam', async () => {
    // Arrange
    const termsOfService: TermsOfServiceStatus = {
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
    const termsOfService: TermsOfServiceStatus = {
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: true,
    };

    setupMockAjax(termsOfService);

    // Act
    await act(async () => { render(h(TermsOfServicePage)) }) //eslint-disable-line

    // Assert
    screen.getByText('Continue under grace period');
  });

  it('does not show "Continue under grace period" when the user has not accepted the latest ToS and is not allowed to use Terra', async () => {
    // Arrange
    const termsOfService: TermsOfServiceStatus = {
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: false,
    };
    // setupMockAjax(termsOfService);

    // Act
    await act(async () => {
      setupMockAjax(termsOfService);
      render(h(TermsOfServicePage));
    }) //eslint-disable-line

    // Assert
    const continueUnderGracePeriodButton = screen.queryByText('Continue under grace period');
    expect(continueUnderGracePeriodButton).not.toBeInTheDocument();
  });

  it('does not show any buttons when the user has accepted the latest ToS and is allowed to use Terra', async () => {
    // Arrange
    const termsOfService: TermsOfServiceStatus = {
      userHasAcceptedLatestTos: true,
      permitsSystemUsage: true,
    };

    setupMockAjax(termsOfService);

    // Act
    await act(async () => {
      render(h(TermsOfServicePage));
    });

    // Assert
    const continueUnderGracePeriodButton = screen.queryByText('Continue under grace period');
    expect(continueUnderGracePeriodButton).not.toBeInTheDocument();

    const acceptButton = screen.queryByText('Accept');
    expect(acceptButton).not.toBeInTheDocument();
  });
});
