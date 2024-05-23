import { Ajax } from 'src/libs/ajax';
import { GoogleStorageContract } from 'src/libs/ajax/GoogleStorage';
import { AsyncRuntimeFields, GetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import {
  RuntimeAjaxContractV1,
  RuntimeAjaxContractV2,
  RuntimesAjaxContract,
  RuntimeWrapperAjaxContract,
} from 'src/libs/ajax/leonardo/Runtimes';
import { asMockedFn, partial } from 'src/testing/test-utils';

import { leoRuntimeProvider, RuntimeBasics, RuntimeErrorInfo } from './LeoRuntimeProvider';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type RuntimesNeeds = Pick<RuntimesAjaxContract, 'listV2' | 'runtime' | 'runtimeV2' | 'runtimeWrapper'>;
type RuntimeV1Needs = Pick<RuntimeAjaxContractV1, 'delete' | 'details'>;
type RuntimeV2Needs = Pick<RuntimeAjaxContractV2, 'delete' | 'details'>;
type RuntimeWrapperNeeds = Pick<RuntimeWrapperAjaxContract, 'stop'>;
type BucketsNeeds = Pick<GoogleStorageContract, 'getObjectPreview'>;

interface AjaxMockNeeds {
  Runtimes: RuntimesNeeds;
  runtimeV1: RuntimeV1Needs;
  runtimeV2: RuntimeV2Needs;
  runtimeWrapper: RuntimeWrapperNeeds;
  Buckets: BucketsNeeds;
}

/**
 * local test utility - mocks the Ajax super-object and the subset of needed multi-contracts it
 * returns with as much type-saftely as possible.
 *
 * @return collection of key contract sub-objects for easy
 * mock overrides and/or method spying/assertions
 */
const mockAjaxNeeds = (): AjaxMockNeeds => {
  const partialRuntimeV1: RuntimeV1Needs = {
    delete: jest.fn(),
    details: jest.fn(),
  };
  const mockRuntimeV1 = partialRuntimeV1 as RuntimeAjaxContractV1;

  const partialRuntimeV2: RuntimeV2Needs = {
    delete: jest.fn(),
    details: jest.fn(),
  };
  const mockRuntimeV2 = partialRuntimeV2 as RuntimeAjaxContractV2;

  const partialRuntimeWrapper: RuntimeWrapperNeeds = {
    stop: jest.fn(),
  };
  const mockRuntimeWrapper = partialRuntimeWrapper as RuntimeWrapperAjaxContract;

  // Ajax.Runtimes root
  const partialRuntimes: RuntimesNeeds = {
    listV2: jest.fn(),
    runtime: jest.fn(),
    runtimeV2: jest.fn(),
    runtimeWrapper: jest.fn(),
  };
  asMockedFn(partialRuntimes.runtime).mockReturnValue(mockRuntimeV1);
  asMockedFn(partialRuntimes.runtimeV2).mockReturnValue(mockRuntimeV2);
  asMockedFn(partialRuntimes.runtimeWrapper).mockReturnValue(mockRuntimeWrapper);

  const partialBuckets: BucketsNeeds = {
    getObjectPreview: jest.fn(),
  };

  asMockedFn(Ajax).mockReturnValue({
    Runtimes: partialRuntimes,
    Buckets: partialBuckets,
  } as AjaxContract);

  return {
    Runtimes: partialRuntimes,
    runtimeV1: partialRuntimeV1,
    runtimeV2: partialRuntimeV2,
    runtimeWrapper: partialRuntimeWrapper,
    Buckets: partialBuckets,
  };
};
describe('leoRuntimeProvider', () => {
  it('handles list runtimes call', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    asMockedFn(ajaxMock.Runtimes.listV2).mockResolvedValue([]);
    const signal = new window.AbortController().signal;

    // Act
    const result = await leoRuntimeProvider.list({ arg: '1' }, { signal });

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(signal);
    expect(ajaxMock.Runtimes.listV2).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.listV2).toBeCalledWith({ arg: '1' });
    expect(result).toEqual([]);
  });

  it('handles errorInfo call - GCP', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();

    const abort = new window.AbortController();

    const runtime: RuntimeBasics = {
      runtimeName: 'myRuntime',
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myGoogleResource',
      },
      googleProject: 'myGoogleProject',
    };
    asMockedFn(ajaxMock.runtimeV1.details).mockResolvedValue({
      errors: [{ errorCode: 123, errorMessage: 'runtime error 1', timestamp: '0:00' }],
    } satisfies Partial<GetRuntimeItem> as GetRuntimeItem);

    // Act
    const errorInfo = await leoRuntimeProvider.errorInfo(runtime, { signal: abort.signal });

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Runtimes.runtime).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.runtime).toBeCalledWith('myGoogleProject', 'myRuntime');
    expect(ajaxMock.runtimeV1.details).toBeCalledTimes(1);

    expect(errorInfo).toEqual({
      errorType: 'ErrorList',
      errors: [{ errorCode: 123, errorMessage: 'runtime error 1', timestamp: '0:00' }],
    } satisfies RuntimeErrorInfo);
  });

  it('handles errorInfo call - GCP with user script error', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();

    const abort = new window.AbortController();

    const runtime: RuntimeBasics = {
      runtimeName: 'myRuntime',
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myGoogleResource',
      },
      googleProject: 'myGoogleProject',
    };
    asMockedFn(ajaxMock.runtimeV1.details).mockResolvedValue(
      partial<GetRuntimeItem>({
        asyncRuntimeFields: partial<AsyncRuntimeFields>({ stagingBucket: 'myBucket' }),
        errors: [{ errorCode: 123, errorMessage: 'Userscript failed: See bucket for details', timestamp: '0:00' }],
      })
    );
    asMockedFn(ajaxMock.Buckets.getObjectPreview).mockResolvedValue(new Response('Error: MeaningOfLife is undefined'));

    // Act
    const errorInfo = await leoRuntimeProvider.errorInfo(runtime, { signal: abort.signal });

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Runtimes.runtime).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.runtime).toBeCalledWith('myGoogleProject', 'myRuntime');
    expect(ajaxMock.runtimeV1.details).toBeCalledTimes(1);
    expect(ajaxMock.Buckets.getObjectPreview).toBeCalledTimes(1);
    expect(ajaxMock.Buckets.getObjectPreview).toBeCalledWith(
      'myGoogleProject',
      'myBucket',
      'userscript_output.txt',
      true
    );

    expect(errorInfo).toEqual({
      errorType: 'UserScriptError',
      detail: 'Error: MeaningOfLife is undefined',
    } satisfies RuntimeErrorInfo);
  });

  it('handles errorInfo call - Azure', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();

    const abort = new window.AbortController();

    const runtime: RuntimeBasics = {
      runtimeName: 'myRuntime',
      cloudContext: {
        cloudProvider: 'AZURE',
        cloudResource: 'myAzureResource',
      },
      workspaceId: 'myWorkspace',
    };
    asMockedFn(ajaxMock.runtimeV2.details).mockResolvedValue(
      partial<GetRuntimeItem>({
        errors: [{ errorCode: 123, errorMessage: 'runtime error 1', timestamp: '0:00' }],
      })
    );

    // Act
    const errorInfo = await leoRuntimeProvider.errorInfo(runtime, { signal: abort.signal });

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Runtimes.runtimeV2).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.runtimeV2).toBeCalledWith('myWorkspace', 'myRuntime');
    expect(ajaxMock.runtimeV2.details).toBeCalledTimes(1);

    expect(errorInfo).toEqual({
      errorType: 'ErrorList',
      errors: [{ errorCode: 123, errorMessage: 'runtime error 1', timestamp: '0:00' }],
    } satisfies RuntimeErrorInfo);
  });

  it('handles stop runtime call', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();

    const abort = new window.AbortController();

    const runtime: RuntimeBasics = {
      runtimeName: 'myRuntime',
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myGoogleResource',
      },
      googleProject: 'myGoogleProject',
    };

    // Act
    void (await leoRuntimeProvider.stop(runtime, { signal: abort.signal }));

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Runtimes.runtimeWrapper).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.runtimeWrapper).toBeCalledWith(runtime);
    expect(ajaxMock.runtimeWrapper.stop).toBeCalledTimes(1);
  });

  it('handles delete runtime call for GCP', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    const abort = new window.AbortController();
    const runtime: RuntimeBasics = {
      runtimeName: 'myRuntime',
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myGoogleResource',
      },
      googleProject: 'myGoogleProject',
    };

    // Act
    // calls to this method generally don't care about passing in signal, but doing it here for completeness
    void (await leoRuntimeProvider.delete(runtime, { signal: abort.signal }));

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Runtimes.runtime).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.runtime).toBeCalledWith('myGoogleProject', 'myRuntime');
    expect(ajaxMock.runtimeV1.delete).toBeCalledTimes(1);
    expect(ajaxMock.runtimeV1.delete).toBeCalledWith(false);
  });

  it('handles delete runtime call for Azure', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    const abort = new window.AbortController();
    const runtime: RuntimeBasics = {
      runtimeName: 'myRuntime',
      cloudContext: {
        cloudProvider: 'AZURE',
        cloudResource: 'myGoogleResource',
      },
      workspaceId: 'myWorkspaceId',
    };

    // Act
    // calls to this method generally don't care about passing in signal, but doing it here for completeness
    void (await leoRuntimeProvider.delete(runtime, { deleteDisk: true, signal: abort.signal }));

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Runtimes.runtimeV2).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.runtimeV2).toBeCalledWith('myWorkspaceId', 'myRuntime');
    expect(ajaxMock.runtimeV2.delete).toBeCalledTimes(1);
    expect(ajaxMock.runtimeV2.delete).toBeCalledWith(true);
  });
});
