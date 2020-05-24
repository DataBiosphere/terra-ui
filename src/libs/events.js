import { useEffect } from 'react'
import { Ajax } from 'src/libs/ajax'
import { useRoute } from 'src/libs/nav'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const eventsList = {
  applicationLaunch: 'application:launch',
  notebookLaunch: 'notebook:launch',
  pageView: `page:view`,
  workflowImport: 'workflow:import',
  workflowLaunch: 'workflow:launch',
  workspaceDataImport: 'workspace:data:import',
  workspaceShare: 'workspace:share'
}

export const extractWorkspaceDetails = workspaceObject => {
  const { workspace: { namespace, name } } = workspaceObject
  return { workspaceName: name, workspaceNamespace: namespace }
}

export const PageViewReporter = () => {
  const { name } = useRoute()
  const { isSignedIn, registrationStatus } = Utils.useStore(authStore)

  useEffect(() => {
    if (isSignedIn && registrationStatus === 'registered') {
      Ajax().Metrics.captureEvent(eventsList.pageView)
    }
  }, [isSignedIn, name, registrationStatus])

  return null
}

export default eventsList
