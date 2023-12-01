import { LeoResourcePermissionsProvider } from 'src/analysis/Environments/Environments';
import { getCreatorForCompute } from 'src/analysis/utils/resource-utils';
import { IHaveCreator } from 'src/libs/ajax/leonardo/models/core-models';
import { getTerraUser } from 'src/libs/state';

const makePermissionsProvider = (userEmailGetter: () => string): LeoResourcePermissionsProvider => {
  const permissionsProvider: LeoResourcePermissionsProvider = {
    canDeleteDisk: (disk: IHaveCreator) => {
      const currentUserEmail = userEmailGetter();
      const canDelete = disk.auditInfo.creator === currentUserEmail;
      return canDelete;
    },
    canPauseResource: (resource: IHaveCreator) => {
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
