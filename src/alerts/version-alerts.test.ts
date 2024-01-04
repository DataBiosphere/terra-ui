import { asMockedFn } from '@terra-ui-packages/test-utils';
import { renderHook } from '@testing-library/react';
import { getConfig } from 'src/libs/config';

import { getLatestVersion, latestVersionStore, useVersionAlerts } from './version-alerts';

type ConfigExports = typeof import('src/libs/config');
jest.mock('src/libs/config', (): ConfigExports => {
  return {
    ...jest.requireActual<ConfigExports>('src/libs/config'),
    getConfig: jest.fn().mockReturnValue({ gitRevision: 'abcd123' }),
  };
});

describe('getLatestVersion', () => {
  it('fetches latest version from app build info', async () => {
    // Arrange
    const mockFetch = jest.spyOn(window, 'fetch').mockResolvedValue(new Response('{"gitRevision":"abcd123"}'));

    // Act
    const latestVersion = await getLatestVersion();

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/build-info.json');
    expect(latestVersion).toBe('abcd123');
  });
});

describe('useVersionAlerts', () => {
  it('returns an empty list if current version and latest version match', () => {
    // Arrange
    asMockedFn(getConfig).mockReturnValue({ gitRevision: 'abcd123' });
    latestVersionStore.set('abcd123');

    // Act
    const { result: hookReturnRef } = renderHook(() => useVersionAlerts());

    // Assert
    expect(hookReturnRef.current).toEqual([]);
  });

  it('returns an alert if current version and latest version do not match', () => {
    // Arrange
    asMockedFn(getConfig).mockReturnValue({ gitRevision: 'abcd123' });
    latestVersionStore.set('1234567');

    // Act
    const { result: hookReturnRef } = renderHook(() => useVersionAlerts());

    // Assert
    expect(hookReturnRef.current).toContainEqual(
      expect.objectContaining({
        id: 'update-available',
        title: 'Update available',
      })
    );
  });
});
