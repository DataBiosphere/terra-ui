import { Ajax } from 'src/libs/ajax';
import {
  DiskAjaxContract,
  DisksAjaxContract,
  DisksAjaxContractV1,
  DisksAjaxContractV2,
} from 'src/libs/ajax/leonardo/Disks';
import { asMockedFn } from 'src/testing/test-utils';

import { DiskBasics, leoDiskProvider } from './LeoDiskProvider';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type DiskNeeds = Pick<DiskAjaxContract, 'delete'>;
type DisksV1Needs = Pick<DisksAjaxContractV1, 'list' | 'disk'>;
type DisksV2Needs = Pick<DisksAjaxContractV2, 'delete'>;

interface AjaxMockNeeds {
  DisksV1: DisksV1Needs;
  DisksV2: DisksV2Needs;
  disk: DiskNeeds;
}

/**
 * local test utility - mocks the Ajax super-object and the subset of needed multi-contracts it
 * returns with as much type-saftely as possible.
 *
 * @return collection of key contract sub-objects for easy
 * mock overrides and/or method spying/assertions
 */
const mockAjaxNeeds = (): AjaxMockNeeds => {
  const partialDisk: DiskNeeds = {
    delete: jest.fn(),
  };
  const mockDisk = partialDisk as DiskAjaxContract;

  const partialDisksV1: DisksV1Needs = {
    disk: jest.fn(),
    list: jest.fn(),
  };
  const mockDisksV1 = partialDisksV1 as DisksAjaxContractV1;

  const partialDisksV2: DisksV2Needs = {
    delete: jest.fn(),
  };
  const mockDisksV2 = partialDisksV2 as DisksAjaxContractV2;

  asMockedFn(mockDisksV1.disk).mockReturnValue(mockDisk);

  // Ajax.Disks root
  const mockDisks: DisksAjaxContract = {
    disksV1: jest.fn(),
    disksV2: jest.fn(),
  };
  asMockedFn(mockDisks.disksV1).mockReturnValue(mockDisksV1);
  asMockedFn(mockDisks.disksV2).mockReturnValue(mockDisksV2);

  asMockedFn(Ajax).mockReturnValue({ Disks: mockDisks } as AjaxContract);

  return {
    DisksV1: partialDisksV1,
    DisksV2: partialDisksV2,
    disk: partialDisk,
  };
};
describe('leoDiskProvider', () => {
  it('handles list call', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    asMockedFn(ajaxMock.DisksV1.list).mockResolvedValue([]);
    const signal = new window.AbortController().signal;

    // Act
    const result = await leoDiskProvider.list({ arg: '1' }, { signal });

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(signal);
    expect(ajaxMock.DisksV1.list).toBeCalledTimes(1);
    expect(ajaxMock.DisksV1.list).toBeCalledWith({ arg: '1' });
    expect(result).toEqual([]);
  });

  it('handles delete disk call for GCP', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    const abort = new window.AbortController();
    const disk: DiskBasics = {
      name: 'myDiskName',
      id: 123,
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myGoogleProject',
      },
    };

    // Act
    // calls to this method generally don't care about passing in signal, but doing it here for completeness
    void (await leoDiskProvider.delete(disk, { signal: abort.signal }));

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.DisksV1.disk).toBeCalledTimes(1);
    expect(ajaxMock.DisksV1.disk).toBeCalledWith('myGoogleProject', 'myDiskName');
    expect(ajaxMock.disk.delete).toBeCalledTimes(1);
  });

  it('handles delete disk call for Azure', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    const abort = new window.AbortController();
    const disk: DiskBasics = {
      name: 'myDiskName',
      id: 123,
      cloudContext: {
        cloudProvider: 'AZURE',
        cloudResource: 'myAzureResource',
      },
    };

    // Act
    // calls to this method generally don't care about passing in signal, but doing it here for completeness
    void (await leoDiskProvider.delete(disk, { signal: abort.signal }));

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.DisksV2.delete).toBeCalledTimes(1);
    expect(ajaxMock.DisksV2.delete).toBeCalledWith(123);
  });
});
