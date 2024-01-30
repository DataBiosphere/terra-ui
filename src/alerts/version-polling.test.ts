import { asMockedFn, withFakeTimers } from '@terra-ui-packages/test-utils';

import { getBadVersions, getLatestVersion, versionStore } from './version-alerts';
import { checkVersion, startPollingVersion, VERSION_POLLING_INTERVAL } from './version-polling';

type VersionAlertsExports = typeof import('./version-alerts');
jest.mock(
  './version-alerts',
  (): VersionAlertsExports => ({
    ...jest.requireActual<VersionAlertsExports>('./version-alerts'),
    getBadVersions: jest.fn(),
    getLatestVersion: jest.fn(),
  })
);

describe('checkVersion', () => {
  it('fetches latest version and updates store', async () => {
    // Arrange
    versionStore.set({ currentVersion: 'abcd123', latestVersion: 'abcd123', isUpdateRequired: false });
    asMockedFn(getLatestVersion).mockResolvedValue('abcd123');

    // Act
    await checkVersion();

    // Assert
    expect(getLatestVersion).toHaveBeenCalled();
    expect(versionStore.get()).toMatchObject({ latestVersion: 'abcd123' });
  });

  describe('if a new version is available', () => {
    beforeEach(() => {
      versionStore.set({ currentVersion: 'abcd123', latestVersion: 'abcd123', isUpdateRequired: false });
      asMockedFn(getLatestVersion).mockResolvedValue('1234567');
    });

    it('checks if the current version is bad', async () => {
      // Arrange
      asMockedFn(getBadVersions).mockResolvedValue([]);

      // Act
      await checkVersion();

      // Assert
      expect(getBadVersions).toHaveBeenCalled();
    });

    it('sets updated required flag if current version is bad', async () => {
      // Arrange
      asMockedFn(getBadVersions).mockResolvedValue(['abcd123']);

      // Act
      await checkVersion();

      // Assert
      expect(versionStore.get()).toMatchObject({ isUpdateRequired: true });
    });
  });
});

const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

describe('startPollingVersion', () => {
  it(
    'periodically fetches latest version and updates store',
    withFakeTimers(async () => {
      // Arrange
      versionStore.set({ currentVersion: 'abcd123', latestVersion: 'abcd123', isUpdateRequired: false });
      asMockedFn(getLatestVersion).mockResolvedValue('1234567');

      // Act
      const stopPolling = startPollingVersion();
      jest.advanceTimersByTime(VERSION_POLLING_INTERVAL);
      await flushPromises();

      // Assert
      expect(asMockedFn(getLatestVersion).mock.calls.length).toBe(1);
      expect(versionStore.get()).toMatchObject({ latestVersion: '1234567' });

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
