import { getServiceAlerts, serviceAlertsStore } from 'src/libs/service-alerts';
import { startPollingServiceAlerts } from 'src/libs/service-alerts-polling';
import { describe, expect, it, vi } from 'vitest';

vi.mock('src/libs/service-alerts', async () => {
  const originalModule = await vi.importActual('src/libs/service-alerts');
  return {
    ...originalModule,
    getServiceAlerts: vi.fn(),
  };
});

const flushPromises = () => {
  return new Promise((resolve) => {
    vi.importActual('timers').then((timers) => timers.setImmediate(resolve));
  });
};

describe('startPollingServiceAlerts', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
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

    vi.advanceTimersByTime(60000);
    expect(getServiceAlerts.mock.calls.length).toBe(2);

    stopPolling();

    vi.advanceTimersByTime(60000);
    expect(getServiceAlerts.mock.calls.length).toBe(2);
  });
});
