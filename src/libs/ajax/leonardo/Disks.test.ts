import { FetchFn } from '@terra-ui-packages/data-client-core';
import { azureDisk, galaxyDisk, undecoratePd } from 'src/analysis/_testData/testData';
import { authOpts } from 'src/auth/auth-session';
import { fetchLeo } from 'src/libs/ajax/ajax-common';
import { Disks } from 'src/libs/ajax/leonardo/Disks';
import { asMockedFn } from 'src/testing/test-utils';

const mockWatchWithAuth = jest.fn();
const mockWatchWithAppId = jest.fn();

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');
jest.mock('src/libs/ajax/ajax-common', (): AjaxCommonExports => {
  const mocks: AjaxCommonExports = {
    ...jest.requireActual('src/libs/ajax/ajax-common'),
    fetchLeo: jest.fn(),
  };
  return mocks;
});

type FetchCoreExports = typeof import('src/libs/ajax/fetch/fetch-core');
type TestUtilsExports = typeof import('src/testing/test-utils');
jest.mock('src/libs/ajax/fetch/fetch-core', (): FetchCoreExports => {
  const { asMockedFn } = jest.requireActual<TestUtilsExports>('src/testing/test-utils');

  const mocks: FetchCoreExports = {
    ...jest.requireActual('src/libs/ajax/fetch/fetch-core'),
    withAppIdentifier: jest.fn(),
  };
  // mock fetch augmentors to call watcher for test assertions below.
  // (mock here so that it's baked in for module-load-time of Disks.ts)

  asMockedFn(mocks.withAppIdentifier!).mockImplementation((fn: FetchFn) => (path, args) => {
    mockWatchWithAppId(path, args);
    return fn(path, args);
  });
  return mocks;
});

type AuthSessionExports = typeof import('src/auth/auth-session');
jest.mock('src/auth/auth-session', (): AuthSessionExports => {
  const { asMockedFn } = jest.requireActual<TestUtilsExports>('src/testing/test-utils');
  const mocks: AuthSessionExports = {
    ...jest.requireActual<AuthSessionExports>('src/auth/auth-session'),
    authOpts: jest.fn(),
    withAuthSession: jest.fn(),
  };
  // mock fetch augmentors to call watcher for test assertions below.
  // (mock here so that it's baked in for module-load-time of Disks.ts)

  asMockedFn(mocks.withAuthSession!).mockImplementation((fn: FetchFn) => (path, args) => {
    mockWatchWithAuth(path, args);
    return fn(path, args);
  });
  return mocks;
});

describe('Disks ajax', () => {
  const signal = new window.AbortController().signal;
  const rawJson = [undecoratePd(azureDisk), undecoratePd(galaxyDisk)];
  beforeEach(() => {
    asMockedFn(authOpts).mockImplementation(jest.fn());
  });

  it('should call the list disk v1 endpoint and return a list of PersistentDisk', async () => {
    // Arrange
    const mockResFn = jest.fn().mockReturnValue(Promise.resolve(rawJson));
    const mockRes = { json: mockResFn };
    const mockFetchLeo = jest.fn().mockReturnValue(Promise.resolve(mockRes));
    asMockedFn(fetchLeo).mockImplementation(mockFetchLeo);

    // Act
    const disks = await Disks(signal).disksV1().list({});

    // Assert
    expect(mockFetchLeo).toHaveBeenCalledWith('api/google/v1/disks', expect.anything());
    expect(disks).toStrictEqual(rawJson);
  });

  it('should call disk delete v1 endpoint with proper auth functions', async () => {
    // Arrange
    const disk = galaxyDisk;
    const mockFetchLeo = jest.fn();
    asMockedFn(fetchLeo).mockImplementation(mockFetchLeo);

    // Act
    await Disks(signal).disksV1().disk(disk.cloudContext.cloudResource, disk.name).delete();

    // Assert
    expect(mockWatchWithAuth).toBeCalledTimes(1);
    expect(mockWatchWithAppId).toBeCalledTimes(1);
    expect(mockFetchLeo).toHaveBeenCalledWith(`api/google/v1/disks/${disk.cloudContext.cloudResource}/${disk.name}`, {
      signal,
      method: 'DELETE',
    });
  });

  it('should call disk update v1 endpoint with proper auth functions', async () => {
    // Arrange
    const disk = galaxyDisk;
    const size = 100;
    const mockFetchLeo = jest.fn();
    asMockedFn(fetchLeo).mockImplementation(mockFetchLeo);

    // Act
    await Disks(signal).disksV1().disk(disk.cloudContext.cloudResource, disk.name).update(size);

    // Assert
    expect(mockWatchWithAuth).toBeCalledTimes(1);
    expect(mockWatchWithAppId).toBeCalledTimes(1);
    expect(mockFetchLeo).toHaveBeenCalledWith(`api/google/v1/disks/${disk.cloudContext.cloudResource}/${disk.name}`, {
      signal,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size }),
    });
  });

  it('should call the details disk v1 endpoint', async () => {
    // Arrange
    const disk = galaxyDisk;
    const mockResFn = jest.fn().mockReturnValue(Promise.resolve(undecoratePd(galaxyDisk)));
    const mockRes = { json: mockResFn };
    const mockFetchLeo = jest.fn().mockReturnValue(Promise.resolve(mockRes));
    asMockedFn(fetchLeo).mockImplementation(mockFetchLeo);

    // Act
    const details = await Disks(signal).disksV1().disk(disk.cloudContext.cloudResource, disk.name).details();

    // Assert
    expect(mockFetchLeo).toHaveBeenCalledWith(`api/google/v1/disks/${disk.cloudContext.cloudResource}/${disk.name}`, {
      signal,
      method: 'GET',
    });
    expect(details).toStrictEqual(undecoratePd(galaxyDisk));
  });

  it('should call the delete disk v2 endpoint', async () => {
    // Arrange
    const disk = azureDisk;
    const mockFetchLeo = jest.fn();
    asMockedFn(fetchLeo).mockImplementation(mockFetchLeo);

    // Act
    await Disks(signal).disksV2().delete(disk.id, { signal });

    // Assert
    expect(mockWatchWithAuth).toBeCalledTimes(1);
    expect(mockWatchWithAppId).toBeCalledTimes(1);
    expect(mockFetchLeo).toHaveBeenCalledWith(`api/v2/disks/${disk.id}`, { signal, method: 'DELETE' });
  });
});
