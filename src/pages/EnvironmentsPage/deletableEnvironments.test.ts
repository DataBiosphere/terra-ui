import { diskStatuses } from '@terra-ui-packages/leonardo-data-client';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { defaultTestDisk, generateTestDisk, generateTestListGoogleRuntime } from 'src/analysis/_testData/testData';
import { isComputePausable } from 'src/analysis/Environments/PauseButton';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { ListRuntimeItem, Runtime, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { getTerraUser, TerraUser } from 'src/libs/state';

import { leoResourceDeletable } from './deletableEnvironments';

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(),
}));
describe('deletableEnvironments', () => {
  it('allows disk delete if disk is deletable', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const myDisk: PersistentDisk = defaultTestDisk;

    // Act
    const canIDeleteDisk = leoResourceDeletable.isResourceInDeletableState(myDisk);

    // Assert
    expect(canIDeleteDisk).toBe(true);
  });

  it('doesnt allow disk delete if disk is not deletable', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const myDisk: PersistentDisk = generateTestDisk({ status: diskStatuses.creating.leoLabel });

    // Act
    const canIDeleteDisk = leoResourceDeletable.isResourceInDeletableState(myDisk);

    // Assert
    expect(canIDeleteDisk).toBe(false);
  });

  it('allows runtime pause if runtime is pausable ', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const myRuntime: ListRuntimeItem = generateTestListGoogleRuntime();

    // Act
    const canIPauseRuntime = isComputePausable(myRuntime);

    // Assert
    expect(canIPauseRuntime).toBe(true);
  });

  it('doesnt allow runtime pause if runtime is not pausable ', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const myRuntime: ListRuntimeItem = generateTestListGoogleRuntime({ status: runtimeStatuses.error.leoLabel });

    // Act
    const canIPauseRuntime = isComputePausable(myRuntime);

    // Assert
    expect(canIPauseRuntime).toBe(false);
  });

  it.each([
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'GALAXY',
      },
      canDeleteApp: true,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'CREATING',
        appType: 'GALAXY',
      },
      canDeleteApp: false,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'CROMWELL',
      },
      canDeleteApp: false,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'WORKFLOWS_APP',
      },
      canDeleteApp: false,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'CROMWELL_RUNNER_APP',
      },
      canDeleteApp: false,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'WDS',
      },
      canDeleteApp: true,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'HAIL_BATCH',
      },
      canDeleteApp: true,
    },
  ] as { resource: App; canDeleteApp: boolean }[])(
    'returns proper boolean for app deletion',
    ({ resource, canDeleteApp }) => {
      expect(leoResourceDeletable.isAppInDeletableState(resource)).toBe(canDeleteApp);
    }
  );

  it.each([
    {
      resource: {
        workspaceId: 'e5795cea-b98f-4b45-a92d-57173e4d1ea4',
        runtimeName: 'saturn-eb643cb0-e6f3-451c-88cd-0c79edd2df64',
        status: 'Stopped',
        runtimeConfig: {
          machineType: 'machine',
          persistentDiskId: 313,
          region: null,
        },
        cloudContext: 'AZURE',
      },
      canDeleteResource: true,
    },
    {
      resource: {
        workspaceId: 'e5795cea-b98f-4b45-a92d-57173e4d1ea4',
        runtimeName: 'saturn-eb643cb0-e6f3-451c-88cd-0c79edd2df64',
        status: 'Creating',
        runtimeConfig: {
          machineType: 'machine',
          persistentDiskId: 313,
          region: null,
        },
        cloudContext: 'AZURE',
      },
      canDeleteResource: false,
    },
    {
      resource: {
        workspaceId: 'e5795cea-b98f-4b45-a92d-57173e4d1ea4',
        runtimeName: 'saturn-eb643cb0-e6f3-451c-88cd-0c79edd2df64',
        status: 'Creating',
        diskType: 'pd-standard',
      },
      canDeleteResource: false,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'GALAXY',
      },
      canDeleteResource: true,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'CROMWELL',
      },
      canDeleteResource: true,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'WORKFLOWS_APP',
      },
      canDeleteResource: true,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'CROMWELL_RUNNER_APP',
      },
      canDeleteResource: true,
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'WDS',
        workspaceId: null,
        cloudContext: { cloudProvider: 'AZURE', cloudResource: 'string' },
        kubernetesRuntimeConfig: { numNodes: 1, machineType: 'string', autoscalingEnabled: false },
        errors: [],
        accessScope: null,
        region: 'abc123',
        proxyUrls: {
          cbas: 'foo.bar',
        },
        diskName: null,
        auditInfo: { creator: 'foo', createdDate: 'bar', destroyedDate: null, dateAccessed: 'accessed' },
        labels: {},
      },
      canDeleteResource: true,
    },
  ] as { resource: App | PersistentDisk | Runtime; canDeleteResource: boolean }[])(
    'returns correct boolean for resource deletion',
    ({ resource, canDeleteResource }) => {
      expect(leoResourceDeletable.isResourceInDeletableState(resource)).toBe(canDeleteResource);
    }
  );
});
