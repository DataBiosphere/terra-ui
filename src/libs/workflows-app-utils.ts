import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';
import { appToolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';

export const resolveRunningCromwellAppUrl = (apps: ListAppResponse[], currentUser: string) => {
  // it looks for Kubernetes deployment status RUNNING expressed by Leo
  // See here for specific enumerations -- https://github.com/DataBiosphere/leonardo/blob/develop/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/kubernetesModels.scala
  // We explicitly look for a RUNNING app because if the CBAS app is not Running, we won't be able to send import method request.

  // note: the requirement for checking if the app was created by user will not be needed when we move to multi-user Workflows app where users with
  // OWNER and WRITER roles will be able to import methods to app created by another user
  const filteredApps: ListAppResponse[] = apps.filter(
    (app) => app.appType === appToolLabels.CROMWELL && app.status === 'RUNNING' && app.auditInfo.creator === currentUser
  );
  if (filteredApps.length === 1) {
    return {
      cbasUrl: filteredApps[0].proxyUrls.cbas,
      cbasUiUrl: filteredApps[0].proxyUrls['cbas-ui'],
    };
  }
  // if there are no Running Cromwell apps or if there are more than one then it's an error state and return null
  return null;
};
