import { act, render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import Alerts from 'src/components/Alerts';
import { Ajax } from 'src/libs/ajax';
import { authStore, SignInStatus, TermsOfServiceStatus } from 'src/libs/state';
import * as TosAlerts from 'src/libs/terms-of-service-alerts';
import { asMockedFn } from 'src/testing/test-utils';

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

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxMetricsContract = AjaxContract['Metrics'];
type AjaxUserContract = AjaxContract['User'];
type AjaxFireCloudBucketContract = AjaxContract['FirecloudBucket'];

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
  const mockFirecloudBucket: Partial<AjaxFireCloudBucketContract> = {
    getTosGracePeriodText: jest.fn().mockReturnValue(Promise.resolve('{"text": "Some text"}')),
  };
  const mockAjax: Partial<AjaxContract> = {
    Metrics: mockMetrics as AjaxMetricsContract,
    User: mockUser as AjaxUserContract,
    FirecloudBucket: mockFirecloudBucket as AjaxFireCloudBucketContract,
  };
  asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
};

afterEach(() => {
  jest.restoreAllMocks();
  TosAlerts.tosGracePeriodAlertsStore.reset();
});

const renderAlerts = async (termsOfService) => {
  await act(async () => { render(h(Alerts)) }) //eslint-disable-line
  setupMockAjax(termsOfService);

  const signInStatus: SignInStatus = 'signedIn';
  await act(async () => { authStore.update(state => ({ ...state, termsOfService, signInStatus })) })  //eslint-disable-line
};

describe('terms-of-service-alerts', () => {
  it('adds a notification when the user has a new Terms of Service to accept', async () => {
    // Arrange
    jest.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

    const termsOfService: TermsOfServiceStatus = {
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

    const termsOfService: TermsOfServiceStatus = {
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
