import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { resolveWdsUrl } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import { getConfig } from 'src/libs/config';
import { getUser, workflowsAppStore } from 'src/libs/state';

export const doesAppProxyUrlExist = (workspaceId, proxyUrlStateField) => {
  const workflowsAppStoreLocal = workflowsAppStore.get();
  return workflowsAppStoreLocal.workspaceId === workspaceId && workflowsAppStoreLocal[proxyUrlStateField].status === 'Ready';
};

export const resolveRunningCromwellAppUrl = (apps, currentUser) => {
  // it looks for Kubernetes deployment status RUNNING expressed by Leo
  // See here for specific enumerations -- https://github.com/DataBiosphere/leonardo/blob/develop/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/kubernetesModels.scala
  // We explicitly look for a RUNNING app because if the CBAS app is not Running, we won't be able to send import method request.

  // note: the requirement for checking if the app was created by user will not be needed when we move to multi-user Workflows app where users with
  // OWNER and WRITER roles will be able to import methods to app created by another user
  const filteredApps = apps.filter(
    (app) => app.appType === appToolLabels.CROMWELL && app.status === 'RUNNING' && app.auditInfo.creator === currentUser
  );
  if (filteredApps.length === 1) {
    return {
      cbasUrl: filteredApps[0].proxyUrls.cbas,
      cbasUiUrl: filteredApps[0].proxyUrls['cbas-ui'],
      cromwellUrl: filteredApps[0].proxyUrls.cromwell,
    };
  }
  // if there are no Running Cromwell apps or if there are more than one then it's an error state and return null
  return null;
};

const resolveProxyUrl = (configRoot, appsList, resolver) => {
  if (configRoot) {
    return { status: 'Ready', state: configRoot };
  }

  try {
    const proxyUrl = resolver(appsList);
    if (proxyUrl) {
      return { status: 'Ready', state: proxyUrl };
    }
    return { status: 'None', state: '' };
  } catch (error) {
    return { status: 'None', state: '' };
  }
};

const setAllAppUrlsFromConfig = (workspaceId, wdsUrlRoot, cbasUrlRoot, cromwellUrlRoot) => {
  const wdsProxyUrlState = { status: 'Ready', state: wdsUrlRoot };
  const cbasProxyUrlState = { status: 'Ready', state: cbasUrlRoot };
  const cromwellProxyUrlState = { status: 'Ready', state: cromwellUrlRoot };

  workflowsAppStore.set({
    workspaceId,
    wdsProxyUrlState,
    cbasProxyUrlState,
    cromwellProxyUrlState,
  });

  return {
    wdsProxyUrlState,
    cbasProxyUrlState,
    cromwellProxyUrlState,
  };
};

const fetchAppUrlsFromLeo = async (workspaceId, wdsUrlRoot, cbasUrlRoot, cromwellUrlRoot) => {
  let wdsProxyUrlState;
  let cbasProxyUrlState;
  let cromwellProxyUrlState;

  try {
    // console.log('Inside fetchAppUrlsFromLeo - Calling Leonardo');
    const appsList = await Ajax().Apps.listAppsV2(workspaceId);
    wdsProxyUrlState = resolveProxyUrl(wdsUrlRoot, appsList, (appsList) => resolveWdsUrl(appsList));
    cbasProxyUrlState = resolveProxyUrl(cbasUrlRoot, appsList, (appsList) => resolveRunningCromwellAppUrl(appsList, getUser()?.email).cbasUrl);
    cromwellProxyUrlState = resolveProxyUrl(
      cromwellUrlRoot,
      appsList,
      (appsList) => resolveRunningCromwellAppUrl(appsList, getUser()?.email).cromwellUrl
    );
  } catch (error) {
    wdsProxyUrlState = { status: 'Error', state: error };
    cbasProxyUrlState = { status: 'Error', state: error };
    cromwellProxyUrlState = { status: 'Error', state: error };
  }

  workflowsAppStore.set({
    workspaceId,
    wdsProxyUrlState,
    cbasProxyUrlState,
    cromwellProxyUrlState,
  });

  // console.log(`Inside fetchAppUrlsFromLeo - updated workflowsAppStore - ${JSON.stringify(workflowsAppStore.get())}`);

  return {
    wdsProxyUrlState,
    cbasProxyUrlState,
    cromwellProxyUrlState,
  };
};

export const loadAppUrls = async (workspaceId, proxyUrlStateField) => {
  if (!doesAppProxyUrlExist(workspaceId, proxyUrlStateField)) {
    // console.log(`Inside loadAppUrls - Proxy url NOT READY for proxyUrlStateField '${proxyUrlStateField}'`);
    // we can set these configs in dev.json if we want local Terra UI to connect to local WDS or Workflows related services
    const wdsUrlRoot = getConfig().wdsUrlRoot;
    const cbasUrlRoot = getConfig().cbasUrlRoot;
    const cromwellUrlRoot = getConfig().cromwellUrlRoot;

    // don't call Leonardo if Terra UI needs to connect to all 3 services locally
    if (wdsUrlRoot && cbasUrlRoot && cromwellUrlRoot) {
      return setAllAppUrlsFromConfig(workspaceId, wdsUrlRoot, cbasUrlRoot, cromwellUrlRoot);
    }
    return await fetchAppUrlsFromLeo(workspaceId, wdsUrlRoot, cbasUrlRoot, cromwellUrlRoot);
  }
  // console.log(`Inside loadAppUrls - Proxy url ALREADY READY for proxyUrlStateField '${proxyUrlStateField}'`);
  const workflowsAppStoreLocal = workflowsAppStore.get();
  return {
    wdsProxyUrlState: workflowsAppStoreLocal.wdsProxyUrlState,
    cbasProxyUrlState: workflowsAppStoreLocal.cbasProxyUrlState,
    cromwellProxyUrlState: workflowsAppStoreLocal.cromwellProxyUrlState,
  };
};
