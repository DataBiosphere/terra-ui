import { useEffect } from 'react'
import { Ajax } from 'src/libs/ajax'
import { useRoute } from 'src/libs/nav'


const eventsList = {
  aboutPersistentDiskView: 'about:persistentDisk:view',
  applicationLaunch: 'application:launch',
  applicationCreate: 'application:create',
  applicationDelete: 'application:delete',
  applicationPause: 'application:pause',
  applicationResume: 'application:resume',
  cloudEnvironmentConfigOpen: 'cloudEnvironment:config:open',
  cloudEnvironmentCreate: 'cloudEnvironment:create',
  cloudEnvironmentDelete: 'cloudEnvironment:delete',
  cloudEnvironmentUpdate: 'cloudEnvironment:update',
  notebookLaunch: 'notebook:launch',
  notebookRename: 'notebook:rename',
  notebookCopy: 'notebook:copy',
  pageView: 'page:view',
  userRegister: 'user:register',
  workflowImport: 'workflow:import',
  workflowLaunch: 'workflow:launch',
  workflowRerun: 'workflow:rerun',
  workspaceClone: 'workspace:clone',
  workspaceCreate: 'workspace:create',
  workspaceDataImport: 'workspace:data:import',
  workspaceShare: 'workspace:share'
}

export const extractWorkspaceDetails = workspaceObject => {
  const { workspace: { namespace, name } } = workspaceObject
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
  const { name } = useRoute()

  useEffect(() => {
    Ajax().Metrics.captureEvent(`${eventsList.pageView}:${name}`)
  }, [name])

  return null
}

export default eventsList
