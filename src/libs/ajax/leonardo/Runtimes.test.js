import { authOpts, fetchLeo } from 'src/libs/ajax/ajax-common';
import { Runtimes } from 'src/libs/ajax/leonardo/Runtimes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/libs/ajax/ajax-common', () => ({
  fetchLeo: vi.fn(),
  authOpts: vi.fn(),
  jsonBody: vi.fn(),
}));

describe('Runtimes ajax', () => {
  const mockFetchLeo = vi.fn();
  beforeEach(() => {
    fetchLeo.mockImplementation(mockFetchLeo);
    authOpts.mockImplementation(vi.fn());
  });

  it.each([
    { googleProject: 'test', runtimeName: 'runtime1', workspaceId: undefined },
    { googleProject: undefined, runtimeName: 'runtime2', workspaceId: 'test' },
  ])('should call the appropriate leo version API for stop function based on the runtime workspaceId: ($workspaceId)', async (runtime) => {
    // Arrange
    // Act
    await Runtimes().runtimeWrapper(runtime).stop();

    // Assert
    if (runtime.workspaceId) {
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/v2/runtimes/${runtime.workspaceId}/${runtime.runtimeName}/stop`, expect.anything());
    } else {
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/google/v1/runtimes/${runtime.googleProject}/${runtime.runtimeName}/stop`, expect.anything());
    }
  });

  it.each([
    { googleProject: 'test', runtimeName: 'runtime1', workspaceId: undefined },
    { googleProject: undefined, runtimeName: 'runtime2', workspaceId: 'test' },
  ])('should call the appropriate leo version API for start function based on the runtime workspaceId: ($workspaceId)', async (runtime) => {
    // Arrange
    // Act
    await Runtimes().runtimeWrapper(runtime).start();

    // Assert
    if (runtime.workspaceId) {
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/v2/runtimes/${runtime.workspaceId}/${runtime.runtimeName}/start`, expect.anything());
    } else {
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/google/v1/runtimes/${runtime.googleProject}/${runtime.runtimeName}/start`, expect.anything());
    }
  });

  it.each([
    { runtimeName: 'runtime1', workspaceId: 'test1', persistentDiskExists: true },
    { runtimeName: 'runtime2', workspaceId: 'test2', persistentDiskExists: false },
  ])('should call use the approprate query param based on the persistent disk status', async (runtime) => {
    // Arrange
    // Act
    await Runtimes().runtimeV2(runtime.workspaceId, runtime.runtimeName).create({}, runtime.persistentDiskExists);

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
