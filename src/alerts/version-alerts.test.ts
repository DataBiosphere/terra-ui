import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { renderHook } from '@testing-library/react';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';

import { getBadVersions, getLatestVersion, latestVersionStore, useVersionAlerts } from './version-alerts';

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<AjaxExports['Ajax']>;

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

describe('getBadVersions', () => {
  it('parses list of bad versions from firecloud-alerts bucket', async () => {
    // Arrange
    const ajaxGetBadVersions = jest.fn().mockResolvedValue('# broken\nabcd123 \neeee456\n\n');
    asMockedFn(Ajax).mockReturnValue({
      FirecloudBucket: { getBadVersions: ajaxGetBadVersions },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    const badVersions = await getBadVersions();

    // Assert
    expect(ajaxGetBadVersions).toHaveBeenCalled();
    expect(badVersions).toEqual(['abcd123', 'eeee456']);
  });

  it('returns empty list if bad versions file does not exist', async () => {
    // Arrange
    const ajaxGetBadVersions = jest.fn().mockRejectedValue(new Response('Not found', { status: 404 }));
    asMockedFn(Ajax).mockReturnValue({
      FirecloudBucket: { getBadVersions: ajaxGetBadVersions },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    const badVersions = await getBadVersions();

    // Assert
    expect(badVersions).toEqual([]);
  });
});
