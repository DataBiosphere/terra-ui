import { EnvironmentPermissionsProvider } from 'src/analysis/Environments/Environments';
import { getCreatorForCompute } from 'src/analysis/utils/resource-utils';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { getTerraUser } from 'src/libs/state';

const makePermissionsProvider = (userEmailGetter: () => string): EnvironmentPermissionsProvider => {
  const permissionsProvider: EnvironmentPermissionsProvider = {
    canDeleteDisk: (disk: PersistentDisk) => {
      const currentUserEmail = userEmailGetter();
      const canDelete = disk.auditInfo.creator === currentUserEmail;
      return canDelete;
    },
    canPauseResource: (resource) => {
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

export const environmentsPermissions = makePermissionsProvider(currentUserEmailGetter);
