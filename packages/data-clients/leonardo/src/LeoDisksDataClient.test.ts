import { FetchFn } from '@terra-ui-packages/data-client-core';

import { DisksHelperDeps, makeDisksHelper } from './LeoDisksDataClient';
import { makeLeoDisksV1DataClient } from './LeoDisksV1DataClient';
import { makeLeoDisksV2DataClient } from './LeoDisksV2DataClient';
import { azureDisk, galaxyDisk } from './testData';

interface DiskTestSetup {
  diskDeps: DisksHelperDeps;
  mockFetchLeo: FetchFn;
}

describe('Disks Data client', () => {
  const signal = new window.AbortController().signal;
  const rawJson = [azureDisk, galaxyDisk];
  const setup = (): DiskTestSetup => {
    const mockResFn = jest.fn().mockReturnValue(Promise.resolve(rawJson));
    const mockRes = { json: mockResFn };
    const mockFetchLeo: FetchFn = jest.fn().mockReturnValue(Promise.resolve(mockRes));

    const disksV1client = makeLeoDisksV1DataClient({ fetchAuthedLeo: mockFetchLeo });
    const disksV2client = makeLeoDisksV2DataClient({ fetchAuthedLeo: mockFetchLeo });
    const diskDeps: DisksHelperDeps = {
      v1Api: disksV1client,
      v2Api: disksV2client,
    };
    return { diskDeps, mockFetchLeo };
  };

  describe('V1', () => {
    it('should call the list disk v1 endpoint and return a list of PersistentDisk', async () => {
      // Arrange
      const { diskDeps, mockFetchLeo } = setup();
      const disksApi = makeDisksHelper(diskDeps);

      // Act
      const disks = await disksApi().disksV1().list();

      // Assert
      expect(mockFetchLeo).toHaveBeenCalledWith('api/google/v1/disks', expect.anything());
      expect(disks).toStrictEqual(rawJson);
    });

    it('should call disk delete v1 endpoint with proper auth functions', async () => {
      // Arrange
      const disk = galaxyDisk;
      const { diskDeps, mockFetchLeo } = setup();
      const disksApi = makeDisksHelper(diskDeps);

      // Act
      await disksApi(signal).disksV1().disk(disk.cloudContext.cloudResource, disk.name).delete();

      // Assert
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/google/v1/disks/${disk.cloudContext.cloudResource}/${disk.name}`, {
        signal,
        method: 'DELETE',
      });
    });

    it('should call disk update v1 endpoint with proper auth functions', async () => {
      // Arrange
      const disk = galaxyDisk;
      const size = 100;
      const { diskDeps, mockFetchLeo } = setup();
      const disksApi = makeDisksHelper(diskDeps);

      // Act
      await disksApi(signal).disksV1().disk(disk.cloudContext.cloudResource, disk.name).update(size);

      // Assert
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
      const mockResFn = jest.fn().mockReturnValue(Promise.resolve(disk));
      const mockRes = { json: mockResFn };
      const mockLocalFetchLeo: FetchFn = jest.fn().mockReturnValue(Promise.resolve(mockRes));

      const disksV1client = makeLeoDisksV1DataClient({ fetchAuthedLeo: mockLocalFetchLeo });
      const { diskDeps } = setup();
      const disksApi = makeDisksHelper({ ...diskDeps, v1Api: disksV1client });

      // Act
      const details = await disksApi(signal).disksV1().disk(disk.cloudContext.cloudResource, disk.name).details();

      // Assert
      expect(mockLocalFetchLeo).toHaveBeenCalledWith(
        `api/google/v1/disks/${disk.cloudContext.cloudResource}/${disk.name}`,
        {
          signal,
          method: 'GET',
        }
      );
      expect(details).toStrictEqual(disk);
    });
  });
  describe('V2', () => {
    it('should call the delete disk v2 endpoint', async () => {
      // Arrange
      const disk = azureDisk;
      const { diskDeps, mockFetchLeo } = setup();
      const disksApi = makeDisksHelper(diskDeps);

      // Act
      await disksApi(signal).disksV2().delete(disk.id, { signal });

      // Assert
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/v2/disks/${disk.id}`, { signal, method: 'DELETE' });
    });
  });
});
