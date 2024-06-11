import { LeoResourcePermissionsProvider } from 'src/analysis/Environments/Environments.models';
import { getCreatorForCompute, isResourceDeletable } from 'src/analysis/utils/resource-utils';
import { cromwellAppToolLabels } from 'src/analysis/utils/tool-utils';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { ListRuntimeItem, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { getTerraUser } from 'src/libs/state';

const makePermissionsProvider = (userEmailGetter: () => string): LeoResourcePermissionsProvider => {
  return <LeoResourcePermissionsProvider>{
    hasDeleteDiskPermission: (disk: PersistentDisk) => {
      const currentUserEmail = userEmailGetter();
      return disk.auditInfo.creator === currentUserEmail;
    },
    hasPausePermission: (resource: App | ListRuntimeItem) => {
      const currentUserEmail = userEmailGetter();
      const creator = getCreatorForCompute(resource);
      return currentUserEmail === creator;
    },
    isAppInDeletableState: (resource: App) => {
      return isResourceDeletable(resource) && !Object.keys(cromwellAppToolLabels).includes(resource.appType);
    },
    isResourceInDeletableState: (resource: App | PersistentDisk | Runtime) => {
      return isResourceDeletable(resource);
    },
  };
};

const currentUserEmailGetter = (): string => {
  return getTerraUser().email!;
};

export const leoResourcePermissions = makePermissionsProvider(currentUserEmailGetter);
