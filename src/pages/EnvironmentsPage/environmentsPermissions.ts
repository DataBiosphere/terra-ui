import { LeoResourcePermissionsProvider } from 'src/analysis/Environments/Environments';
import { getCreatorForCompute } from 'src/analysis/utils/resource-utils';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { getTerraUser } from 'src/libs/state';

const makePermissionsProvider = (userEmailGetter: () => string): LeoResourcePermissionsProvider => {
  const permissionsProvider: LeoResourcePermissionsProvider = {
    canDeleteDisk: (disk: PersistentDisk) => {
      const currentUserEmail = userEmailGetter();
      const canDelete = disk.auditInfo.creator === currentUserEmail;
      return canDelete;
    },
    canPauseResource: (resource: App | ListRuntimeItem) => {
      const currentUserEmail = userEmailGetter();
      const creator = getCreatorForCompute(resource);
      return currentUserEmail === creator;
    },
  };
  return permissionsProvider;
};

const currentUserEmailGetter = (): string => {
  return getTerraUser().email!;
};

export const leoResourcePermissions = makePermissionsProvider(currentUserEmailGetter);
