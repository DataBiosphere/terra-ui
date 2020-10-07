import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { PlaygroundHeader, RuntimeKicker, RuntimeStatusMonitor, StatusMessage } from 'src/components/cluster-common'
import { Link, spinnerOverlay } from 'src/components/common'
import { NewClusterModal } from 'src/components/NewClusterModal'
import { Ajax } from 'src/libs/ajax'
import { collapsedRuntimeStatus, currentRuntime, usableStatuses } from 'src/libs/cluster-utils'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { cookieReadyStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const ApplicationLauncher = _.flow(
  Utils.forwardRefWithName('ApplicationLauncher'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: _.get('application')
  })
)(({ namespace, name, refreshRuntimes, runtimes, persistentDisks, application }, ref) => {
  const cookieReady = Utils.useStore(cookieReadyStore)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  const runtime = currentRuntime(runtimes)
  const runtimeStatus = collapsedRuntimeStatus(runtime) // preserve null vs undefined

  return h(Fragment, [
    h(RuntimeStatusMonitor, {
      runtime,
      onRuntimeStartedRunning: () => {
        Ajax().Metrics.captureEvent(Events.applicationLaunch, { application })
      }
    }),
    h(RuntimeKicker, {
      runtime, refreshRuntimes,
      onNullRuntime: () => setShowCreate(true)
    }),
    _.includes(runtimeStatus, usableStatuses) && cookieReady ?
      h(Fragment, [
        application === 'RStudio' && h(PlaygroundHeader, [
          'This feature is in early development. Your files are saved on your cloud environment but not to your workspace. We encourage you to frequently ',
          h(Link, {
            href: 'https://support.terra.bio/hc/en-us/articles/360037269472#h_822db925-41fa-4797-b0da-0839580a74da',
            ...Utils.newTabLinkProps
          }, ['back up your files manually']),
          '.'
        ]),
        iframe({
          src: `${runtime.proxyUrl}/${application === 'terminal' ? 'terminals/1' : ''}`,
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
        h(NewClusterModal, {
          isOpen: showCreate,
          namespace, name, runtimes, persistentDisks,
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
  }
]
