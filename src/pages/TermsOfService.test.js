import { act, render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { authStore } from 'src/libs/state';
import TermsOfServicePage from 'src/pages/TermsOfService';

jest.mock('src/libs/ajax');
jest.mock('react-notifications-component', () => {
  return {
    store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

const setupMockAjax = (termsOfService) => {
  const getTos = jest.fn().mockReturnValue(Promise.resolve('some text'));
  const getTermsOfServiceComplianceStatus = jest.fn().mockReturnValue(Promise.resolve(termsOfService));
  const getStatus = jest.fn().mockReturnValue(Promise.resolve({}));
  Ajax.mockImplementation(() => ({
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
    },
  }));

  const isSignedIn = true;
  authStore.update((state) => ({ ...state, termsOfService, isSignedIn }));
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
    const termsOfService = {
      userHasAcceptedLatestTos: true,
      permitsSystemUsage: true,
    };

    const { getTosFn } = setupMockAjax(termsOfService);

    // Act
    await act(async () => { render(h(TermsOfServicePage)) }) //eslint-disable-line

    // Assert
    expect(getTosFn).toHaveBeenCalled();

    const termsOfServiceText = screen.findByText('some text');
    expect(termsOfServiceText).not.toBeFalsy();
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
    const continueUnderGracePeriodButton = screen.findByText('Continue under grace period');
    expect(continueUnderGracePeriodButton).not.toBeFalsy();
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
});
