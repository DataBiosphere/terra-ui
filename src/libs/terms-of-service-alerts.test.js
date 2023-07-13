import { act, render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import Alerts from 'src/components/Alerts';
import { Ajax } from 'src/libs/ajax';
import { authStore } from 'src/libs/state';
import * as TosAlerts from 'src/libs/terms-of-service-alerts';

jest.mock('src/libs/ajax');

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn().mockReturnValue(''),
}));

jest.mock('react-notifications-component', () => {
  return {
    Store: {
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
    FirecloudBucket: {
      getTosGracePeriodText: jest.fn().mockReturnValue(Promise.resolve('{"text": "Some text"}')),
    },
  }));
};

afterEach(() => {
  jest.restoreAllMocks();
  TosAlerts.tosGracePeriodAlertsStore.reset();
});

const renderAlerts = async (termsOfService) => {
  await act(async () => { render(h(Alerts)) }) //eslint-disable-line
  setupMockAjax(termsOfService);

  const isSignedIn = true;
  await act(async () => { authStore.update(state => ({ ...state, termsOfService, isSignedIn })) })  //eslint-disable-line
};

describe('terms-of-service-alerts', () => {
  it('adds a notification when the user has a new Terms of Service to accept', async () => {
    // Arrange
    jest.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

    const termsOfService = {
      userHasAcceptedLatestTos: false,
      permitsSystemUsage: true,
    };

    // Act
    await renderAlerts(termsOfService);

    // Assert
    expect(TosAlerts.useTermsOfServiceAlerts).toHaveBeenCalled();
    expect(TosAlerts.tosGracePeriodAlertsStore.get().length).toEqual(1);
    expect(TosAlerts.tosGracePeriodAlertsStore.get()[0].id).toEqual('terms-of-service-needs-accepting-grace-period');
  });

  it('does not add a notification when the user does not have a new Terms of Service to accept', async () => {
    // Arrange
    jest.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

    const termsOfService = {
      userHasAcceptedLatestTos: true,
      permitsSystemUsage: true,
    };

    // Act
    await renderAlerts(termsOfService);

    // Assert
    expect(TosAlerts.useTermsOfServiceAlerts).toHaveBeenCalled();
    expect(TosAlerts.tosGracePeriodAlertsStore.get().length).toEqual(0);
  });
});
