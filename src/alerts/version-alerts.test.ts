import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { renderHook } from '@testing-library/react';
import { Ajax } from 'src/libs/ajax';

import { getBadVersions, useVersionAlerts, versionStore } from './version-alerts';

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<AjaxExports['Ajax']>;

describe('useVersionAlerts', () => {
  it('returns an empty list if current version and latest version match', () => {
    // Arrange
    versionStore.set({
      currentVersion: 'abcd123',
      latestVersion: 'abcd123',
      isUpdateRequired: false,
    });

    // Act
    const { result: hookReturnRef } = renderHook(() => useVersionAlerts());

    // Assert
    expect(hookReturnRef.current).toEqual([]);
  });

  it('returns an alert if current version and latest version do not match', () => {
    // Arrange
    versionStore.set({
      currentVersion: 'abcd123',
      latestVersion: '1234567',
      isUpdateRequired: false,
    });

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
