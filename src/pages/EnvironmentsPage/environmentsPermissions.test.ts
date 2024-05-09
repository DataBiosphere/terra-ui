import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { getTerraUser, TerraUser } from 'src/libs/state';

import { leoResourcePermissions } from './environmentsPermissions';

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(),
}));
describe('environmentsPermissions', () => {
  it('allows disk delete for permitted user', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const myDisk: PersistentDisk = {
      auditInfo: { creator: 'me@here.org' },
    } as DeepPartial<PersistentDisk> as PersistentDisk;

    // Act
    const canIDeleteDisk = leoResourcePermissions.hasDeleteDiskPermission(myDisk);

    // Assert
    expect(canIDeleteDisk).toBe(true);
  });
  it('blocks disk delete for non-permitted user', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const otherDisk: PersistentDisk = {
      auditInfo: { creator: 'you@there.org' },
    } as DeepPartial<PersistentDisk> as PersistentDisk;

    // Act
    const canIDeleteDisk = leoResourcePermissions.hasDeleteDiskPermission(otherDisk);

    // Assert
    expect(canIDeleteDisk).toBe(false);
  });
  it('allows resource pause for permitted user', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const myRuntime: ListRuntimeItem = {
      auditInfo: { creator: 'me@here.org' },
    } as DeepPartial<ListRuntimeItem> as ListRuntimeItem;

    // Act
    const canIDeleteDisk = leoResourcePermissions.hasPausePermission(myRuntime);

    // Assert
    expect(canIDeleteDisk).toBe(true);
  });
  it('blocks resource pausing for non-permitted user', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const otherRuntime: ListRuntimeItem = {
      auditInfo: { creator: 'you@there.org' },
    } as DeepPartial<ListRuntimeItem> as ListRuntimeItem;

    // Act
    const canIDeleteDisk = leoResourcePermissions.hasPausePermission(otherRuntime);

    // Assert
    expect(canIDeleteDisk).toBe(false);
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
      expect(leoResourcePermissions.isAppInDeletableState(resource)).toBe(canDeleteApp);
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
      expect(leoResourcePermissions.isResourceInDeletableState(resource)).toBe(canDeleteResource);
    }
  );
});
