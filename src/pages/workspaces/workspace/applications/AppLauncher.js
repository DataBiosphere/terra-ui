import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ClusterKicker, ClusterStatusMonitor, PeriodicCookieSetter, PlaygroundHeader, StatusMessage } from 'src/components/cluster-common'
import { Link, spinnerOverlay } from 'src/components/common'
import { NewClusterModal } from 'src/components/NewClusterModal'
import { Ajax } from 'src/libs/ajax'
import { collapsedClusterStatus, usableStatuses } from 'src/libs/cluster-utils'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const AppLauncher = _.flow(
  Utils.forwardRefWithName('AppLauncher'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: _.get('app')
  })
)(({ namespace, refreshClusters, cluster, app }, ref) => {
  const [cookieReady, setCookieReady] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  const clusterStatus = collapsedClusterStatus(cluster) // preserve null vs undefined
  const runtimeName = cluster?.runtimeName

  return h(Fragment, [
    h(ClusterStatusMonitor, {
      cluster,
      onClusterStartedRunning: async () => {
        await Ajax().Clusters.notebooks(namespace, runtimeName).setCookie()
        setCookieReady(true)
        Ajax().Metrics.captureEvent(Events.applicationLaunch, { app })
      },
      onClusterStoppedRunning: () => setCookieReady(false)
    }),
    h(ClusterKicker, {
      cluster, refreshClusters,
      onNullCluster: () => setShowCreate(true)
    }),
    _.includes(clusterStatus, usableStatuses) && cookieReady ?
      h(Fragment, [
        h(PeriodicCookieSetter, { namespace, runtimeName }),
        app === 'RStudio' && h(PlaygroundHeader, [
          'This feature is in early development. Your files are saved on your runtime but not to your workspace. We encourage you to frequently ',
          h(Link, {
            href: 'https://support.terra.bio/hc/en-us/articles/360037269472#h_822db925-41fa-4797-b0da-0839580a74da',
            ...Utils.newTabLinkProps
          }, ['back up your files manually']),
          '.'
        ]),
        iframe({
          src: `${cluster.proxyUrl}/${app === 'terminal' ? 'terminals/1' : ''}`,
          style: {
            border: 'none', flex: 1,
            ...(app === 'terminal' ? { marginTop: -45, clipPath: 'inset(45px 0 0)' } : {}) // cuts off the useless Jupyter top bar
          },
          title: `Interactive ${app} iframe`
        })
      ]) :
      div({ style: { padding: '2rem' } }, [
        !busy && h(StatusMessage, { hideSpinner: ['Error', 'Stopped', null].includes(clusterStatus) }, [
          Utils.cond(
            [clusterStatus === 'Creating', () => 'Creating notebook runtime environment. You can navigate away and return in 3-5 minutes.'],
            [clusterStatus === 'Starting', () => 'Starting notebook runtime environment, this may take up to 2 minutes.'],
            [_.includes(clusterStatus, usableStatuses), () => 'Almost ready...'],
            [clusterStatus === 'Stopping', () => 'Notebook runtime environment is stopping, which takes ~4 minutes. You can restart it after it finishes.'],
            [clusterStatus === 'Stopped', () => 'Notebook runtime environment is stopped. Start it to edit your notebook or use the terminal.'],
            [clusterStatus === 'LeoReconfiguring', () => 'Notebook runtime environment is updating, please wait.'],
            [clusterStatus === 'Error', () => 'Error with the notebook runtime environment, please try again.'],
            [clusterStatus === null, () => 'Create a notebook runtime to continue.'],
            [clusterStatus === undefined, () => 'Loading...'],
            () => 'Unknown notebook runtime status. Please create a new runtime or contact support.'
          )
        ]),
        h(NewClusterModal, {
          isOpen: showCreate,
          namespace, currentCluster: cluster,
          onDismiss: () => setShowCreate(false),
          onSuccess: _.flow(
            withErrorReporting('Error creating cluster'),
            Utils.withBusyState(setBusy)
          )(async promise => {
            setShowCreate(false)
            await promise
            await refreshClusters()
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
    component: props => h(Nav.Redirector, { pathname: Nav.getPath('workspace-app-launch', { ...props, app: 'terminal' }) })
  },
  {
    name: 'workspace-app-launch',
    path: '/workspaces/:namespace/:name/applications/:app',
    component: AppLauncher,
    title: ({ name, app }) => `${name} - ${app}`
  }
]
