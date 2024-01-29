import { DecoratedComputeResource, PermissionsAndStateProvider } from 'src/analysis/Environments/Environments.models';
import { getCreatorForCompute, isResourceDeletable } from 'src/analysis/utils/resource-utils';
import { cromwellAppToolLabels } from 'src/analysis/utils/tool-utils';
import { App, isApp } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { getTerraUser } from 'src/libs/state';

const makeStateAndPermissionsProvider = (userEmailGetter: () => string): PermissionsAndStateProvider => {
  return <PermissionsAndStateProvider>{
    canDeleteDisk: (disk: PersistentDisk) => {
      const currentUserEmail = userEmailGetter();
      return disk.auditInfo.creator === currentUserEmail;
    },
    canPauseResource: (resource: App | ListRuntimeItem) => {
      const currentUserEmail = userEmailGetter();
      const creator = getCreatorForCompute(resource);
      return currentUserEmail === creator;
    },
    canDeleteApp: (resource: DecoratedComputeResource) => {
      if (isApp(resource)) {
        return !Object.keys(cromwellAppToolLabels).includes(resource.appType);
      }
    },
    canDeleteResource: (resourceType, resource: App | PersistentDisk | Runtime) => {
      return isResourceDeletable(resourceType, resource);
    },
  };
};

const currentUserEmailGetter = (): string => {
  return getTerraUser().email!;
};

export const stateAndPermissionsProvider = makeStateAndPermissionsProvider(currentUserEmailGetter);
