import { generateTestDiskWithGoogleWorkspace } from 'src/analysis/_testData/testData';
import { Ajax } from 'src/libs/ajax';
import { DisksContractV1, DisksDataClientContract } from 'src/libs/ajax/leonardo/Disks';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { RuntimesAjaxContract } from 'src/libs/ajax/leonardo/Runtimes';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';
import { defaultGoogleWorkspace, defaultInitializedGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { useCloudEnvironmentPolling } from './useCloudEnvironmentPolling';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type RuntimesNeeds = Pick<RuntimesAjaxContract, 'listV2'>;
type DisksV1Needs = Pick<DisksContractV1, 'list'>;
interface AjaxMockNeeds {
  Disks: DiskMockNeeds;
}

interface RuntimeMockNeeds {
  topLevel: RuntimesNeeds;
}

interface DiskMockNeeds {
  DisksV1: DisksV1Needs;
}

interface AjaxMockNeeds {
  Disks: DiskMockNeeds;
  Runtimes: RuntimeMockNeeds;
}

/**
 * local test utility - mocks the Ajax super-object and the subset of needed multi-contracts it
 * returns with as much type-safety as possible.
 *
 * @return collection of key contract sub-objects for easy
 * mock overrides and/or method spying/assertions
 */
const mockAjaxNeeds = (): AjaxMockNeeds => {
  const partialDisksV1: DisksV1Needs = {
    list: jest.fn(),
  };
  const mockDisksV1 = partialDisksV1 as DisksContractV1;

  const mockDisks: DisksDataClientContract = {
    disksV1: () => mockDisksV1,
    disksV2: jest.fn(),
  };

  const partialRuntimes: RuntimesNeeds = {
    listV2: jest.fn(),
  };
  const mockRuntimes = partialRuntimes as RuntimesAjaxContract;

  asMockedFn(Ajax).mockReturnValue({ Disks: mockDisks, Runtimes: mockRuntimes } as AjaxContract);

  return {
    Disks: {
      DisksV1: partialDisksV1,
    },
    Runtimes: {
      topLevel: partialRuntimes,
    },
  };
};

describe('useCloudEnvironmentPolling', () => {
  it('calls list disk', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    const appDisk = generateTestDiskWithGoogleWorkspace({}, defaultGoogleWorkspace);
    // Remove the label used to detect app disks
    const persistentDisk: PersistentDisk = {
      ...appDisk,
      labels: {
        saturnWorkspaceName: appDisk.labels.saturnWorkspaceName,
        saturnWorkspaceNamespace: appDisk.labels.saturnWorkspaceNamespace,
      },
    };

    asMockedFn(ajaxMock.Disks.DisksV1.list).mockResolvedValue([appDisk, persistentDisk]);

    // Act
    const { result } = await renderHookInAct(() =>
      useCloudEnvironmentPolling(
        defaultGoogleWorkspace.workspace.name,
        defaultGoogleWorkspace.workspace.namespace,
        defaultInitializedGoogleWorkspace
      )
    );

    // Assert
    // Runtimes and disk ajax calls
    expect(Ajax).toBeCalledTimes(2);
    expect(ajaxMock.Disks.DisksV1.list).toBeCalledTimes(1);
    expect(result.current.persistentDisks).toEqual([persistentDisk]);
    expect(result.current.appDataDisks).toEqual([appDisk]);
  });
});
