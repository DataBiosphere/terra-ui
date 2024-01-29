import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { DecoratedComputeResource } from 'src/analysis/Environments/Environments.models';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { getTerraUser, TerraUser } from 'src/libs/state';

import { stateAndPermissionsProvider } from './environmentsPermissions';

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
    const canIDeleteDisk = stateAndPermissionsProvider.canDeleteDisk(myDisk);

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
    const canIDeleteDisk = stateAndPermissionsProvider.canDeleteDisk(otherDisk);

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
    const canIDeleteDisk = stateAndPermissionsProvider.canPauseResource(myRuntime);

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
    const canIDeleteDisk = stateAndPermissionsProvider.canPauseResource(otherRuntime);

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
  ] as { resource: DecoratedComputeResource; canDeleteApp: boolean }[])(
    'returns proper boolean for app deletion',
    ({ resource, canDeleteApp }) => {
      expect(stateAndPermissionsProvider.canDeleteApp(resource)).toBe(canDeleteApp);
    }
  );

  it.each([
    {
      resource: {
        workspaceId: 'e5795cea-b98f-4b45-a92d-57173e4d1ea4',
        runtimeName: 'saturn-eb643cb0-e6f3-451c-88cd-0c79edd2df64',
        status: 'Stopped',
      },
      canDeleteResource: true,
      resourceType: 'runtime',
    },
    {
      resource: {
        workspaceId: 'e5795cea-b98f-4b45-a92d-57173e4d1ea4',
        runtimeName: 'saturn-eb643cb0-e6f3-451c-88cd-0c79edd2df64',
        status: 'Creating',
      },
      canDeleteResource: false,
      resourceType: 'runtime',
    },
    {
      resource: {
        workspaceId: 'e5795cea-b98f-4b45-a92d-57173e4d1ea4',
        runtimeName: 'saturn-eb643cb0-e6f3-451c-88cd-0c79edd2df64',
        status: 'Creating',
      },
      canDeleteResource: false,
      resourceType: 'disk',
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'GALAXY',
      },
      canDeleteResource: true,
      resourceType: 'app',
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'CROMWELL',
      },
      canDeleteResource: true,
      resourceType: 'app',
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'WORKFLOWS_APP',
      },
      canDeleteResource: true,
      resourceType: 'app',
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'CROMWELL_RUNNER_APP',
      },
      canDeleteResource: true,
      resourceType: 'app',
    },
    {
      resource: {
        appName: 'terra-app-3f07f6aa-6531-4151-824d-0ab8d0f19cd1',
        status: 'RUNNING',
        appType: 'WDS',
      },
      canDeleteResource: true,
      resourceType: 'app',
    },
  ] as { resource: App | PersistentDisk | Runtime; canDeleteResource: boolean; resourceType: string }[])(
    'returns correct boolean for resource deletion',
    ({ resource, canDeleteResource, resourceType }) => {
      expect(stateAndPermissionsProvider.canDeleteResource(resourceType, resource)).toBe(canDeleteResource);
    }
  );
});
