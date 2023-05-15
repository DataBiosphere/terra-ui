import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { h } from 'react-hyperscript-helpers';
import Alerts from 'src/components/Alerts';
import { Ajax } from 'src/libs/ajax';
import { authStore } from 'src/libs/state';
import * as TosAlerts from 'src/libs/terms-of-service-alerts';
import { describe, expect, it, vi } from 'vitest';

vi.mock('src/libs/ajax');

vi.mock('src/libs/nav', async () => {
  const originalModule = await vi.importActual('src/libs/nav');
  return {
    ...originalModule,
    getLink: vi.fn().mockReturnValue(''),
  };
});

vi.mock('react-notifications-component', () => {
  return {
    store: {
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
    },
  };
});

const setupMockAjax = (termsOfService) => {
  const getTos = vi.fn().mockReturnValue(Promise.resolve('some text'));
  const getTermsOfServiceComplianceStatus = vi.fn().mockReturnValue(Promise.resolve(termsOfService));
  const getStatus = vi.fn().mockReturnValue(Promise.resolve({}));
  Ajax.mockImplementation(() => ({
    Metrics: {
      captureEvent: vi.fn(),
    },
    User: {
      profile: {
        get: vi.fn().mockReturnValue(Promise.resolve({ keyValuePairs: [] })),
      },
      getTos,
      getTermsOfServiceComplianceStatus,
      getStatus,
    },
    FirecloudBucket: {
      getTosGracePeriodText: vi.fn().mockReturnValue(Promise.resolve('{"text": "Some text"}')),
    },
  }));
};

afterEach(() => {
  vi.restoreAllMocks();
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
    vi.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

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
    vi.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

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
