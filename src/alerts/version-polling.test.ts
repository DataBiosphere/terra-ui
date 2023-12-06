import { asMockedFn, withFakeTimers } from '@terra-ui-packages/test-utils';

import { getBadVersions, getLatestVersion, latestVersionStore } from './version-alerts';
import { checkVersion, startPollingVersion, VERSION_POLLING_INTERVAL } from './version-polling';

type ConfigExports = typeof import('src/libs/config');
jest.mock('src/libs/config', (): ConfigExports => {
  return {
    ...jest.requireActual<ConfigExports>('src/libs/config'),
    getConfig: jest.fn().mockReturnValue({ gitRevision: 'abcd123' }),
  };
});

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
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: jest.fn() },
    });
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  it('fetches latest version and updates store', async () => {
    // Arrange
    asMockedFn(getLatestVersion).mockResolvedValue('abcd123');

    // Act
    await checkVersion();

    // Assert
    expect(getLatestVersion).toHaveBeenCalled();
    expect(latestVersionStore.get()).toBe('abcd123');
  });

  describe('if a new version is available', () => {
    beforeEach(() => {
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

    it('reloads the page if current version is bad', async () => {
      // Arrange
      asMockedFn(getBadVersions).mockResolvedValue(['abcd123']);

      // Act
      await checkVersion();

      // Assert
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('does not reload the page if current version is good', async () => {
      // Arrange
      asMockedFn(getBadVersions).mockResolvedValue([]);

      // Act
      await checkVersion();

      // Assert
      expect(window.location.reload).not.toHaveBeenCalled();
    });
  });

  it('does not reload if the current version is bad but there is no new version available', async () => {
    // Arrange
    asMockedFn(getLatestVersion).mockResolvedValue('abcd123');
    asMockedFn(getBadVersions).mockResolvedValue(['abcd123']);

    // Act
    await checkVersion();

    // Assert
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});

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
