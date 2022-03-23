import _ from 'lodash/fp'
import { useEffect } from 'react'
import { Ajax } from 'src/libs/ajax'
import { useRoute } from 'src/libs/nav'


const eventsList = {
  aboutPersistentDiskView: 'about:persistentDisk:view',
  appcuesEvent: 'appcues:event',
  applicationLaunch: 'application:launch',
  applicationCreate: 'application:create',
  applicationDelete: 'application:delete',
  applicationPause: 'application:pause',
  applicationResume: 'application:resume',
  analysisEnableBeta: 'analysis:enable',
  analysisDisableBeta: 'analysis:disable',
  analysisLaunch: 'analysis:launch',
  analysisCreate: 'analysis:create',
  billingProjectExpandWorkspace: 'billing:project:workspace:expand',
  billingProjectGoToWorkspace: 'billing:project:workspace:navigate',
  billingProjectOpenFromList: 'billing:project:open-from-list',
  billingProjectSelectTab: 'billing:project:tab',
  changeBillingAccount: 'billing:project:account:update',
  cloudEnvironmentConfigOpen: 'cloudEnvironment:config:open',
  cloudEnvironmentCreate: 'cloudEnvironment:create',
  cloudEnvironmentDelete: 'cloudEnvironment:delete',
  cloudEnvironmentUpdate: 'cloudEnvironment:update',
  catalogFilter: 'catalog:filter',
  catalogRequestAccess: 'catalog:requestAccess',
  catalogView: 'catalog:view',
  catalogWorkspaceLink: 'catalog:workspaceLink',
  datasetLibraryBrowseData: 'library:browseData',
  dataTableSaveColumnSettings: 'dataTable:saveColumnSettings',
  dataTableLoadColumnSettings: 'dataTable:loadColumnSettings',
  notebookLaunch: 'notebook:launch',
  notebookRename: 'notebook:rename',
  notebookCopy: 'notebook:copy',
  pageView: 'page:view',
  removeBillingAccount: 'billing:project:account:remove',
  userRegister: 'user:register',
  workflowImport: 'workflow:import',
  workflowLaunch: 'workflow:launch',
  workflowRerun: 'workflow:rerun',
  workspaceClone: 'workspace:clone',
  workspaceCreate: 'workspace:create',
  workspaceDataCopy: 'workspace:data:copy',
  workspaceDataDelete: 'workspace:data:delete',
  workspaceDataDownload: 'workspace:data:download',
  workspaceDataDownloadPartial: 'workspace:data:downloadpartial',
  workspaceDataOpenWithIGV: 'workspace:data:igv',
  workspaceDataOpenWithWorkflow: 'workspace:data:workflow',
  workspaceDataOpenWithDataExplorer: 'workspace:data:dataexplorer',
  workspaceDataOpenWithNotebook: 'workspace:data:notebook',
  workspaceDataImport: 'workspace:data:import',
  workspaceDataUpload: 'workspace:data:upload',
  workspaceOpenFromList: 'workspace:open-from-list',
  workspaceSampleTsvDownload: 'workspace:sample-tsv:download',
  workspaceShare: 'workspace:share',
  workspaceSnapshotDelete: 'workspace:snapshot:delete',
  workspaceSnapshotContentsView: 'workspace:snapshot:contents:view'
}

export const extractWorkspaceDetails = workspaceObject => {
  const { name, namespace } = workspaceObject
  return { workspaceName: name, workspaceNamespace: namespace }
}

export const extractCrossWorkspaceDetails = (fromWorkspace, toWorkspace) => {
  return {
    fromWorkspaceNamespace: fromWorkspace.workspace.namespace,
    fromWorkspaceName: fromWorkspace.workspace.name,
    toWorkspaceNamespace: toWorkspace.workspace.namespace,
    toWorkspaceName: toWorkspace.workspace.name
  }
}

export const PageViewReporter = () => {
  const { name, params } = useRoute()

  useEffect(() => {
    const isWorkspace = /^#workspaces\/.+\/.+/.test(window.location.hash)

    Ajax().Metrics.captureEvent(
      `${eventsList.pageView}:${name}`,
      isWorkspace ? extractWorkspaceDetails(params) : undefined
    )
  }, [name, params])

  return null
}

export const captureAppcuesEvent = (eventName, event) => {
  // Only record "public-facing events" (and related properties) as documented by Appcues: https://docs.appcues.com/article/301-client-side-events-reference
  const publicEvents = [
    'flow_started',
    'flow_completed',
    'flow_skipped',
    'flow_aborted',
    'step_started',
    'step_completed',
    'step_skipped',
    'step_aborted',
    'step_interacted',
    'form_submitted',
    'form_field_submitted'
  ]
  if (_.includes(eventName, publicEvents)) {
    const eventProps = { // Building the props manually to make sure we're resilient to any changes in Appcues
      'appcues.flowId': event.flowId,
      'appcues.flowName': event.flowName,
      'appcues.flowType': event.flowType,
      'appcues.flowVersion': event.flowVersion,
      'appcues.id': event.id,
      'appcues.interaction.category': event.interaction?.category,
      'appcues.interaction.destination': event.interaction?.destination,
      'appcues.interaction.element': event.interaction?.element,
      'appcues.interaction.fields': JSON.stringify(event.interaction?.fields),
      'appcues.interaction.formId': event.interaction?.formId,
      'appcues.interaction.text': event.interaction?.text, // not documented by Appcues, but observed and useful
      'appcues.interactionType': event.interactionType,
      'appcues.localeId': event.localeId,
      'appcues.localeName': event.localeName,
      'appcues.name': event.name,
      'appcues.sessionId': event.sessionId,
      'appcues.stepChildId': event.stepChildId,
      'appcues.stepChildNumber': event.stepChildNumber,
      'appcues.stepId': event.stepId,
      'appcues.stepNumber': event.stepNumber,
      'appcues.stepType': event.stepType,
      'appcues.timestamp': event.timestamp
    }
    return Ajax().Metrics.captureEvent(eventsList.appcuesEvent, eventProps)
  }
}

export default eventsList
