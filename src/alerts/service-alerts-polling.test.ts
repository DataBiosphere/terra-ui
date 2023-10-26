import { asMockedFn } from '@terra-ui-packages/test-utils';

import { getServiceAlerts, serviceAlertsStore } from './service-alerts';
import { startPollingServiceAlerts } from './service-alerts-polling';

type ServiceAlertsExports = typeof import('./service-alerts');
jest.mock(
  './service-alerts',
  (): ServiceAlertsExports => ({
    ...jest.requireActual<ServiceAlertsExports>('./service-alerts'),
    getServiceAlerts: jest.fn(),
  })
);

const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

describe('startPollingServiceAlerts', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('periodically fetches service alerts and updates store', async () => {
    asMockedFn(getServiceAlerts).mockReturnValue(
      Promise.resolve([
        {
          id: 'scheduled-maintenance',
          title: 'Scheduled maintenance',
          message: 'Offline tomorrow',
          severity: 'info',
        },
      ])
    );

    const stopPolling = startPollingServiceAlerts();
    await flushPromises();

    expect(asMockedFn(getServiceAlerts).mock.calls.length).toBe(1);
    expect(serviceAlertsStore.get()).toEqual([
      expect.objectContaining({
        title: 'Scheduled maintenance',
        message: 'Offline tomorrow',
        severity: 'info',
      }),
    ]);

    jest.advanceTimersByTime(60000);
    expect(asMockedFn(getServiceAlerts).mock.calls.length).toBe(2);

    stopPolling();

    jest.advanceTimersByTime(60000);
    expect(asMockedFn(getServiceAlerts).mock.calls.length).toBe(2);
  });
});
