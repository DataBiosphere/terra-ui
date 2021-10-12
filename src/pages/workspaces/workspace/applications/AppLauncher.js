import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
import { ComputeModal } from 'src/components/ComputeModal'
import { appLauncherTabName, RuntimeKicker, RuntimeStatusMonitor, StatusMessage } from 'src/components/runtime-common'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { getConvertedRuntimeStatus, getCurrentRuntime, usableStatuses } from 'src/libs/runtime-utils'
import { cookieReadyStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const getSparkInterfaceSource = (proxyUrl, sparkInterface) => {
  console.assert(_.endsWith('/jupyter', proxyUrl), 'Unexpected ending for proxy URL')
  const proxyUrlWithlastSegmentDropped = _.flow(_.split('/'), _.dropRight(1), _.join('/'))(proxyUrl)
  return `${proxyUrlWithlastSegmentDropped}/${sparkInterface}`
}

const getApplicationIFrameSource = (proxyUrl, application, sparkInterface) => {
  return Utils.switchCase(application,
    ['terminal', () => `${proxyUrl}/terminals/1`],
    ['spark', () => getSparkInterfaceSource(proxyUrl, sparkInterface)],
    [Utils.DEFAULT, () => proxyUrl] // RStudio
  )
}

const ApplicationLauncher = _.flow(
  Utils.forwardRefWithName('ApplicationLauncher'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: _.get('application'),
    activeTab: appLauncherTabName
  }) // TODO: Check if name: workspaceName could be moved into the other workspace deconstruction
)(({ name: workspaceName, sparkInterface, refreshRuntimes, runtimes, persistentDisks, application, workspace, workspace: { workspace: { googleProject, bucketName } } }, ref) => {
  const cookieReady = Utils.useStore(cookieReadyStore)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  // We've already init Welder if app is Jupyter.
  // TODO: We are stubbing this to never set up welder until we resolve some backend issues around file syncing
  // See following tickets for status (both parts needed):
  // PT1 - https://broadworkbench.atlassian.net/browse/IA-2991
  // PT2 - https://broadworkbench.atlassian.net/browse/IA-2990
  const [shouldSetupWelder, setShouldSetupWelder] = useState(false) // useState(application == tools.RStudio.label)

  const runtime = getCurrentRuntime(runtimes)
  const runtimeStatus = getConvertedRuntimeStatus(runtime) // preserve null vs undefined

  useEffect(() => {
    const runtime = getCurrentRuntime(runtimes)
    const runtimeStatus = getConvertedRuntimeStatus(runtime)

    const setupWelder = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('Error setting up analysis file syncing')
    )(async () => {
      const localBaseDirectory = ``
      const localSafeModeBaseDirectory = ``
      const cloudStorageDirectory = `gs://${bucketName}/notebooks`

      await Ajax()
        .Runtimes
        .fileSyncing(googleProject, runtime.runtimeName)
        .setStorageLinks(localBaseDirectory, localSafeModeBaseDirectory, cloudStorageDirectory, `.*\\.Rmd`)
    })

    if (shouldSetupWelder && runtimeStatus === 'Running') {
      setupWelder()
      setShouldSetupWelder(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleProject, workspaceName, runtimes, bucketName])

  return h(Fragment, [
    h(RuntimeStatusMonitor, {
      runtime,
      onRuntimeStartedRunning: () => {
        Ajax().Metrics.captureEvent(Events.applicationLaunch, { app: application })
      }
    }),
    h(RuntimeKicker, {
      runtime, refreshRuntimes,
      onNullRuntime: () => setShowCreate(true)
    }),
    _.includes(runtimeStatus, usableStatuses) && cookieReady ?
      h(Fragment, [
        iframe({
          src: getApplicationIFrameSource(runtime.proxyUrl, application, sparkInterface),
          style: {
            border: 'none', flex: 1,
            ...(application === 'terminal' ? { marginTop: -45, clipPath: 'inset(45px 0 0)' } : {}) // cuts off the useless Jupyter top bar
          },
          title: `Interactive ${application} iframe`
        })
      ]) :
      div({ style: { padding: '2rem' } }, [
        !busy && h(StatusMessage, { hideSpinner: ['Error', 'Stopped', null].includes(runtimeStatus) }, [
          Utils.cond(
            [runtimeStatus === 'Creating', () => 'Creating cloud environment. You can navigate away and return in 3-5 minutes.'],
            [runtimeStatus === 'Starting', () => 'Starting cloud environment, this may take up to 2 minutes.'],
            [_.includes(runtimeStatus, usableStatuses), () => 'Almost ready...'],
            [runtimeStatus === 'Stopping', () => 'Cloud environment is stopping, which takes ~4 minutes. You can restart it after it finishes.'],
            [runtimeStatus === 'Stopped', () => 'Cloud environment is stopped. Start it to edit your notebook or use the terminal.'],
            [runtimeStatus === 'LeoReconfiguring', () => 'Cloud environment is updating, please wait.'],
            [runtimeStatus === 'Error', () => 'Error with the cloud environment, please try again.'],
            [runtimeStatus === null, () => 'Create a cloud environment to continue.'],
            [runtimeStatus === undefined, () => 'Loading...'],
            () => 'Unknown cloud environment status. Please create a new cloud environment or contact support.'
          )
        ]),
        h(ComputeModal, {
          isOpen: showCreate,
          workspace,
          runtimes,
          persistentDisks,
          onDismiss: () => setShowCreate(false),
          onSuccess: _.flow(
            withErrorReporting('Error loading cloud environment'),
            Utils.withBusyState(setBusy)
          )(async () => {
            setShowCreate(false)
            await refreshRuntimes(true)
          })
        }),
        busy && spinnerOverlay
      ])
  ])
})


export const navPaths = [
  {
    name: 'workspace-terminal', // legacy
    path: '/workspaces/:namespace/:name/notebooks/terminal',
    component: props => h(Nav.Redirector, { pathname: Nav.getPath('workspace-application-launch', { ...props, application: 'terminal' }) })
  },
  {
    name: 'workspace-application-launch',
    path: '/workspaces/:namespace/:name/applications/:application',
    component: ApplicationLauncher,
    title: ({ name, application }) => `${name} - ${application}`
  },
  {
    name: 'workspace-spark-interface-launch',
    path: '/workspaces/:namespace/:name/applications/:application/:sparkInterface',
    component: ApplicationLauncher,
    title: ({ name, application, sparkInterface }) => `${name} - ${application} - ${sparkInterface}`
  }
]
