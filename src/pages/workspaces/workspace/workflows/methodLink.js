import { getEnabledBrand } from 'src/libs/brand-utils';
import { getConfig } from 'src/libs/config';

export const methodLink = (config) => {
  const {
    methodRepoMethod: { sourceRepo, methodVersion, methodNamespace, methodName, methodPath },
  } = config;
  return sourceRepo === 'agora'
    ? `${getConfig().firecloudUrlRoot}/?return=${getEnabledBrand().queryName}#methods/${methodNamespace}/${methodName}/${methodVersion}`
    : `${getConfig().dockstoreUrlRoot}/workflows/${methodPath}:${methodVersion}`;
};
