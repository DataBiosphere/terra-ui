import { LeoResourceDeletableProvider } from 'src/analysis/Environments/Environments.models';
import { isResourceDeletable } from 'src/analysis/utils/resource-utils';
import { cromwellAppToolLabels } from 'src/analysis/utils/tool-utils';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';

const makeDeletableProvider = (): LeoResourceDeletableProvider => {
  return <LeoResourceDeletableProvider>{
    isAppInDeletableState: (resource: App) => {
      return isResourceDeletable(resource) && !Object.keys(cromwellAppToolLabels).includes(resource.appType);
    },
    isResourceInDeletableState: (resource: App | PersistentDisk | Runtime) => {
      return isResourceDeletable(resource);
    },
  };
};

export const leoResourceDeletable = makeDeletableProvider();
