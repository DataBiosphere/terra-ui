import { getServiceAlerts, serviceAlertsStore } from './service-alerts';
import { startPollingServiceAlerts } from './service-alerts-polling';

jest.mock('./service-alerts', () => ({
  ...jest.requireActual('./service-alerts'),
  getServiceAlerts: jest.fn(),
}));

const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

describe('startPollingServiceAlerts', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('periodically fetches service alerts and updates store', async () => {
    getServiceAlerts.mockReturnValue(
      Promise.resolve([
        {
          title: 'Scheduled maintenance',
          message: 'Offline tomorrow',
          severity: 'info',
        },
      ])
    );

    const stopPolling = startPollingServiceAlerts();
    await flushPromises();

    expect(getServiceAlerts.mock.calls.length).toBe(1);
    expect(serviceAlertsStore.get()).toEqual([
      expect.objectContaining({
        title: 'Scheduled maintenance',
        message: 'Offline tomorrow',
        severity: 'info',
      }),
    ]);

    jest.advanceTimersByTime(60000);
    expect(getServiceAlerts.mock.calls.length).toBe(2);

    stopPolling();

    jest.advanceTimersByTime(60000);
    expect(getServiceAlerts.mock.calls.length).toBe(2);
  });
});
