import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import {
  ClusterKicker, ClusterStatusMonitor, GalaxyStatusMonitor, PeriodicCookieSetter, PlaygroundHeader, StatusMessage
} from 'src/components/cluster-common'
import { Link, spinnerOverlay } from 'src/components/common'
import { NewClusterModal } from 'src/components/NewClusterModal'
import { Ajax } from 'src/libs/ajax'
import { collapsedClusterStatus, currentApp, currentCluster, usableStatuses } from 'src/libs/cluster-utils'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const GalaxyLauncher = _.flow(
  Utils.forwardRefWithName('GalaxyLauncher'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: _.get('app')
  })
)(({ namespace, name, refreshClusters, apps, persistentDisks }, ref) => {
  const [cookieReady, setCookieReady] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  const galaxyApp = currentApp(apps)
  const clusterStatus = collapsedClusterStatus(cluster) // preserve null vs undefined
  const runtimeName = cluster?.runtimeName

  return h(Fragment, [
    h(GalaxyStatusMonitor, {
      galaxyApp,
      onGalaxyAppStartedRunning: async () => {
        await Ajax().Clusters.setCookie()
        setCookieReady(true)
      },
      onGalaxyAppStoppedRunning: () => setCookieReady(false)
    }),
    // TODO: handle when there isn't a Galaxy app yet
    // h(ClusterKicker, {
    //   cluster, refreshClusters,
    //   onNullCluster: () => setShowCreate(true)
    // }),
    _.includes(clusterStatus, usableStatuses) && cookieReady ?
      h(Fragment, [
        h(PeriodicCookieSetter, { namespace, runtimeName }),
        iframe({
          src: galaxyApp.proxyUrl,
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
            [clusterStatus === 'Creating', () => 'Creating cloud environment. You can navigate away and return in 3-5 minutes.'],
            [clusterStatus === 'Starting', () => 'Starting cloud environment, this may take up to 2 minutes.'],
            [_.includes(clusterStatus, usableStatuses), () => 'Almost ready...'],
            [clusterStatus === 'Stopping', () => 'Cloud environment is stopping, which takes ~4 minutes. You can restart it after it finishes.'],
            [clusterStatus === 'Stopped', () => 'Cloud environment is stopped. Start it to edit your notebook or use the terminal.'],
            [clusterStatus === 'LeoReconfiguring', () => 'Cloud environment is updating, please wait.'],
            [clusterStatus === 'Error', () => 'Error with the cloud environment, please try again.'],
            [clusterStatus === null, () => 'Create a cloud environment to continue.'],
            [clusterStatus === undefined, () => 'Loading...'],
            () => 'Unknown cloud environment status. Please create a new cloud environment or contact support.'
          )
        ]),
        h(NewClusterModal, {
          isOpen: showCreate,
          namespace, name, clusters, persistentDisks,
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
