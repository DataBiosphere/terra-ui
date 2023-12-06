import { asMockedFn, withFakeTimers } from '@terra-ui-packages/test-utils';

import { getLatestVersion, latestVersionStore } from './version-alerts';
import { startPollingVersion, VERSION_POLLING_INTERVAL } from './version-polling';

type VersionAlertsExports = typeof import('./version-alerts');
jest.mock(
  './version-alerts',
  (): VersionAlertsExports => ({
    ...jest.requireActual<VersionAlertsExports>('./version-alerts'),
    getLatestVersion: jest.fn(),
  })
);

const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

describe('startPollingVersion', () => {
  it(
    'periodically fetches latest version and updates store',
    withFakeTimers(async () => {
      // Arrange
      asMockedFn(getLatestVersion).mockResolvedValue('abcd123');

      // Act
      const stopPolling = startPollingVersion();
      jest.advanceTimersByTime(VERSION_POLLING_INTERVAL);
      await flushPromises();

      // Assert
      expect(asMockedFn(getLatestVersion).mock.calls.length).toBe(1);
      expect(latestVersionStore.get()).toBe('abcd123');

      // Act
      jest.advanceTimersByTime(VERSION_POLLING_INTERVAL);
      await flushPromises();

      // Assert
      expect(asMockedFn(getLatestVersion).mock.calls.length).toBe(2);

      // Act
      stopPolling();
      jest.advanceTimersByTime(VERSION_POLLING_INTERVAL);
      await flushPromises();

      // Assert
      expect(asMockedFn(getLatestVersion).mock.calls.length).toBe(2);
    })
  );
});
