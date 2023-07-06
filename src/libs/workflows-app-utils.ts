import _ from 'lodash/fp';
import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';

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

export const isInputOptional = (ioType) => _.get('type', ioType) === 'optional';

export const inputTypeStyle = (iotype) => {
  if (_.get('type', iotype) === 'optional') {
    return { fontStyle: 'italic' };
  }
  return {};
};

export const renderTypeText = (iotype) => {
  if (_.has('primitive_type', iotype)) {
    return iotype.primitive_type;
  }
  if (_.has('optional_type', iotype)) {
    return `${renderTypeText(_.get('optional_type', iotype))}`;
  }
  if (_.has('array_type', iotype)) {
    return `Array[${renderTypeText(_.get('array_type', iotype))}]`;
  }
  if (_.get('type', iotype) === 'map') {
    return `Map[${_.get('key_type', iotype)}, ${renderTypeText(_.get('value_type', iotype))}]`;
  }
  if (_.get('type', iotype) === 'struct') {
    return 'Struct';
  }
  return 'Unsupported Type';
};
