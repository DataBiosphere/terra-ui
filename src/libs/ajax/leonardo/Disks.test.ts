import { azureDisk, galaxyDisk } from 'src/analysis/_testData/testData';
import { authOpts, fetchLeo } from 'src/libs/ajax/ajax-common';
import { Disks } from 'src/libs/ajax/leonardo/Disks';
import { PersistentDisk, RawPersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { asMockedFn } from 'src/testing/test-utils';

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');
jest.mock(
  'src/libs/ajax/ajax-common',
  (): AjaxCommonExports => ({
    ...jest.requireActual('src/libs/ajax/ajax-common'),
    fetchLeo: jest.fn(),
    authOpts: jest.fn(),
  })
);

export const undecoratePd = (disk: PersistentDisk): RawPersistentDisk => ({
  ...disk,
  diskType: disk.diskType.value,
});
// Decorated jsons that are expected to be returned by the ajax layer
const expectedJson = [azureDisk, galaxyDisk];
// Undecorated jsons that are expected to be returned from the leo API
const rawJson = [undecoratePd(azureDisk), undecoratePd(galaxyDisk)];

describe('Disks ajax', () => {
  const signal = jest.fn();
  beforeEach(() => {
    asMockedFn(authOpts).mockImplementation(jest.fn());
  });

  it('should call the lisk disk v1 endpoint and return a list of PersistentDisk', async () => {
    // Arrange
    const mockResFn = jest.fn().mockReturnValue(Promise.resolve(rawJson));
    const mockRes = { json: mockResFn };
    const mockFetchLeo = jest.fn().mockReturnValue(Promise.resolve(mockRes));
    asMockedFn(fetchLeo).mockImplementation(mockFetchLeo);

    // Act
    const disks = await Disks(signal).disksV1().list();

    // Assert
    expect(mockFetchLeo).toHaveBeenCalledWith('api/google/v1/disks', expect.anything());
    expect(disks).toStrictEqual(expectedJson);
  });
});
