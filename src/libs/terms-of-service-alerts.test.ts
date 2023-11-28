import { act } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { AlertsIndicator } from 'src/alerts/Alerts';
import { Ajax } from 'src/libs/ajax';
import { Groups } from 'src/libs/ajax/Groups';
import { Metrics } from 'src/libs/ajax/Metrics';
import { TermsOfService } from 'src/libs/ajax/TermsOfService';
import { User } from 'src/libs/ajax/User';
import { authStore } from 'src/libs/state';
import * as TosAlerts from 'src/libs/terms-of-service-alerts';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

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
  const getTermsOfServiceText = jest.fn().mockReturnValue(Promise.resolve('some text'));
  const getTermsOfServiceComplianceStatus = jest.fn().mockReturnValue(Promise.resolve(termsOfService));
  const getStatus = jest.fn().mockReturnValue(Promise.resolve({}));
  type AjaxContract = ReturnType<typeof Ajax>;
  type UserContract = ReturnType<typeof User>;
  type MetricsContract = ReturnType<typeof Metrics>;
  type GroupsContract = ReturnType<typeof Groups>;
  type TermsOfServiceContract = ReturnType<typeof TermsOfService>;

  asMockedFn(Ajax).mockImplementation( () =>
      ({
        Metrics: {
          captureEvent: jest.fn(),
        } as Partial<MetricsContract>,
        User: {
          profile: {
            get: jest.fn().mockReturnValue(Promise.resolve({keyValuePairs: []})),
          } as Partial<UserContract>['profile'],
          getStatus,
        } as Partial<UserContract>,
        TermsOfService: {
          getTermsOfServiceText,
        } as Partial<TermsOfServiceContract>,
      } as Partial<AjaxContract> as AjaxContract)
  }));
};

afterEach(() => {
  jest.restoreAllMocks();
  TosAlerts.tosAlertsStore.reset();
});

const renderAlerts = async (termsOfService) => {
  await act(async () => {
    render(h(AlertsIndicator));
  });
  setupMockAjax(termsOfService);

  const signInStatus = 'authenticated';
  await act(async () => {
    authStore.update((state) => ({ ...state, termsOfService, signInStatus }));
  });
};

describe('terms-of-service-alerts', () => {
  it('adds a notification when the user has a new Terms of Service to accept', async () => {
    // Arrange
    jest.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

    const termsOfService = {
      isCurrentVersion: false,
      permitsSystemUsage: true,
    };

    // Act
    await renderAlerts(termsOfService);

    // Assert
    expect(TosAlerts.useTermsOfServiceAlerts).toHaveBeenCalled();
    expect(TosAlerts.tosAlertsStore.get().length).toEqual(1);
    expect(TosAlerts.tosAlertsStore.get()[0].id).toEqual('terms-of-service-needs-accepting-grace-period');
  });

  it('does not add a notification when the user does not have a new Terms of Service to accept', async () => {
    // Arrange
    jest.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

    const termsOfService = {
      isCurrentVersion: true,
      permitsSystemUsage: true,
    };

    // Act
    await renderAlerts(termsOfService);

    // Assert
    expect(TosAlerts.useTermsOfServiceAlerts).toHaveBeenCalled();
    expect(TosAlerts.tosAlertsStore.get().length).toEqual(0);
  });
});
