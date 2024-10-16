import { FetchFn } from '@terra-ui-packages/data-client-core';
import { authOpts } from 'src/auth/auth-session';
import { fetchLeo } from 'src/libs/ajax/ajax-common';
import { Runtimes } from 'src/libs/ajax/leonardo/Runtimes';
import { asMockedFn } from 'src/testing/test-utils';

const mockWatchWithAuth = jest.fn();
const mockWatchWithAppId = jest.fn();

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');
jest.mock('src/libs/ajax/ajax-common', (): Partial<AjaxCommonExports> => {
  const mocks: Partial<AjaxCommonExports> = {
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
  // (mock here so that it's baked in for module-load-time of Runtimes.ts)
  asMockedFn(mocks.withAuthSession!).mockImplementation((fn: FetchFn) => (path, args) => {
    mockWatchWithAuth(path, args);
    return fn(path, args);
  });

  return mocks;
});

describe('Runtimes ajax', () => {
  const mockFetchLeo = jest.fn();
  const signal = new window.AbortController().signal;
  beforeEach(() => {
    asMockedFn(fetchLeo).mockImplementation(mockFetchLeo);
    asMockedFn(authOpts).mockImplementation(jest.fn());
  });

  it.each([
    { googleProject: 'test', runtimeName: 'runtime1', workspaceId: undefined },
    { googleProject: undefined, runtimeName: 'runtime2', workspaceId: 'test' },
  ])(
    'should call the appropriate leo version API for stop function based on the runtime workspaceId: ($workspaceId)',
    async (runtime) => {
      // Arrange
      // Act
      await Runtimes(signal).runtimeWrapper(runtime).stop();

      // Assert
      if (runtime.workspaceId) {
        expect(mockFetchLeo).toHaveBeenCalledWith(
          `api/v2/runtimes/${runtime.workspaceId}/${runtime.runtimeName}/stop`,
          expect.anything()
        );
      } else {
        expect(mockFetchLeo).toHaveBeenCalledWith(
          `api/google/v1/runtimes/${runtime.googleProject}/${runtime.runtimeName}/stop`,
          expect.anything()
        );
        expect(mockWatchWithAuth).toBeCalledTimes(1);
        expect(mockWatchWithAppId).toBeCalledTimes(1);
      }
    }
  );

  it.each([
    { googleProject: 'test', runtimeName: 'runtime1', workspaceId: undefined },
    { googleProject: undefined, runtimeName: 'runtime2', workspaceId: 'test' },
  ])(
    'should call the appropriate leo version API for start function based on the runtime workspaceId: ($workspaceId)',
    async (runtime) => {
      // Arrange
      // Act
      await Runtimes(signal).runtimeWrapper(runtime).start();

      // Assert
      if (runtime.workspaceId) {
        expect(mockFetchLeo).toHaveBeenCalledWith(
          `api/v2/runtimes/${runtime.workspaceId}/${runtime.runtimeName}/start`,
          expect.anything()
        );
      } else {
        expect(mockFetchLeo).toHaveBeenCalledWith(
          `api/google/v1/runtimes/${runtime.googleProject}/${runtime.runtimeName}/start`,
          expect.anything()
        );
        expect(mockWatchWithAuth).toBeCalledTimes(1);
        expect(mockWatchWithAppId).toBeCalledTimes(1);
      }
    }
  );

  it.each([
    { runtimeName: 'runtime1', workspaceId: 'test1', persistentDiskExists: true },
    { runtimeName: 'runtime2', workspaceId: 'test2', persistentDiskExists: false },
  ])('should call use the approprate query param based on the persistent disk status', async (runtime) => {
    // Arrange
    // Act
    await Runtimes(signal).runtimeV2(runtime.workspaceId, runtime.runtimeName).create({}, runtime.persistentDiskExists);

    // Assert
    if (runtime.persistentDiskExists) {
      expect(mockFetchLeo).toHaveBeenCalledWith(
        `api/v2/runtimes/${runtime.workspaceId}/azure/${runtime.runtimeName}?useExistingDisk=true`,
        expect.anything()
      );
    } else {
      expect(mockFetchLeo).toHaveBeenCalledWith(
        `api/v2/runtimes/${runtime.workspaceId}/azure/${runtime.runtimeName}?useExistingDisk=false`,
        expect.anything()
      );
    }
  });
});
