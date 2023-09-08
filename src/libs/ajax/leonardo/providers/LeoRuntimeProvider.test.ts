import { Ajax } from 'src/libs/ajax';
import {
  RuntimeAjaxContractV1,
  RuntimeAjaxContractV2,
  RuntimesAjaxContract,
  RuntimeWrapperAjaxContract,
} from 'src/libs/ajax/leonardo/Runtimes';
import { asMockedFn } from 'src/testing/test-utils';

import { leoRuntimeProvider, RuntimeBasics } from './LeoRuntimeProvider';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type RuntimesNeeds = Pick<RuntimesAjaxContract, 'listV2' | 'runtime' | 'runtimeV2' | 'runtimeWrapper'>;
type RuntimeV1Needs = Pick<RuntimeAjaxContractV1, 'delete'>;
type RuntimeV2Needs = Pick<RuntimeAjaxContractV2, 'delete'>;
type RuntimeWrapperNeeds = Pick<RuntimeWrapperAjaxContract, 'stop'>;

interface AjaxMockNeeds {
  Runtimes: RuntimesNeeds;
  runtimeV1: RuntimeV1Needs;
  runtimeV2: RuntimeV2Needs;
  runtimeWrapper: RuntimeWrapperNeeds;
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
  };
  const mockRuntimeV1 = partialRuntimeV1 as RuntimeAjaxContractV1;

  const partialRuntimeV2: RuntimeV2Needs = {
    delete: jest.fn(),
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

  asMockedFn(Ajax).mockReturnValue({ Runtimes: partialRuntimes } as AjaxContract);

  return {
    Runtimes: partialRuntimes,
    runtimeV1: partialRuntimeV1,
    runtimeV2: partialRuntimeV2,
    runtimeWrapper: partialRuntimeWrapper,
  };
};
describe('leoRuntimeProvider', () => {
  it('handles list runtimes call', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    asMockedFn(ajaxMock.Runtimes.listV2).mockResolvedValue([]);
    const abort = new window.AbortController();

    // Act
    const result = await leoRuntimeProvider.list({ arg: '1' }, abort.signal);

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Runtimes.listV2).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.listV2).toBeCalledWith({ arg: '1' });
    expect(result).toEqual([]);
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
    void (await leoRuntimeProvider.stop(runtime, abort.signal));

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
    void (await leoRuntimeProvider.delete(runtime, false, abort.signal));

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
    void (await leoRuntimeProvider.delete(runtime, false, abort.signal));

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Runtimes.runtimeV2).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.runtimeV2).toBeCalledWith('myWorkspaceId', 'myRuntime');
    expect(ajaxMock.runtimeV2.delete).toBeCalledTimes(1);
    expect(ajaxMock.runtimeV2.delete).toBeCalledWith(false);
  });
});
