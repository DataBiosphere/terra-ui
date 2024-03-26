import { getEnabledBrand } from 'src/libs/brand-utils';
import { getConfig } from 'src/libs/config';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { FIRECLOUD_UI_MIGRATION } from 'src/libs/feature-previews-config';
import * as Nav from 'src/libs/nav';

export const methodLink = (config) => {
  const {
    methodRepoMethod: { sourceRepo, methodVersion, methodNamespace, methodName, methodPath },
  } = config;

  if (sourceRepo === 'agora') {
    if (isFeaturePreviewEnabled(FIRECLOUD_UI_MIGRATION)) {
      return Nav.getLink('workflow-dashboard', { namespace: methodNamespace, name: methodName, snapshotId: methodVersion });
    }
    return `${getConfig().firecloudUrlRoot}/?return=${getEnabledBrand().queryName}#methods/${methodNamespace}/${methodName}/${methodVersion}`;
  }
  return `${getConfig().dockstoreUrlRoot}/workflows/${methodPath}:${methodVersion}`;
};
