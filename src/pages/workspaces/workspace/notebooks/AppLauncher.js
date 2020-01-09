import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ClusterKicker, ClusterStatusMonitor, PeriodicCookieSetter, PlaygroundHeader, StatusMessage } from 'src/components/cluster-common'
import { Link, spinnerOverlay } from 'src/components/common'
import { NewClusterModal } from 'src/components/NewClusterModal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
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

  const clusterStatus = cluster && cluster.status

  return h(Fragment, [
    h(ClusterStatusMonitor, {
      cluster,
      onClusterStartedRunning: async () => {
        await Ajax().Clusters.notebooks(namespace, cluster.clusterName).setCookie()
        setCookieReady(true)
      },
      onClusterStoppedRunning: () => setCookieReady(false)
    }),
    h(ClusterKicker, {
      cluster, refreshClusters,
      onNullCluster: () => setShowCreate(true)
    }),
    cookieReady ?
      h(Fragment, [
        h(PeriodicCookieSetter, { namespace, clusterName: cluster.cluster }),
        app === 'RStudio' && h(PlaygroundHeader, [
          'This feature is in early development. Your R Code is saved on your compute instance but not to your workspace. We encourage you to frequently ',
          h(Link, {
            href: 'https://support.terra.bio/hc/en-us/articles/360037269472#h_822db925-41fa-4797-b0da-0839580a74da',
            ...Utils.newTabLinkProps
          }, ['back up your code manually']),
          '.'
        ]),
        iframe({
          src: `${cluster.clusterUrl}/${app === 'terminal' ? 'terminals/1' : ''}`,
          style: {
            border: 'none', flex: 1,
            ...(app === 'terminal' ? { marginTop: -45, clipPath: 'inset(45px 0 0)' } : {}) // cuts off the useless Jupyter top bar
          },
          title: `Interactive ${app} iframe`
        })
      ]) :
      div({ style: { padding: '2rem' } }, [
        h(StatusMessage, { hideSpinner: ['Error', 'Stopped', null].includes(clusterStatus) }, [
          Utils.switchCase(clusterStatus,
            ['Running', () => 'Almost ready...'],
            ['Creating', () => 'Creating application compute instance. You can navigate away and return in 3-5 minutes.'],
            ['Stopping', () => 'Application compute instance is stopping. This takes ~4 minutes.'],
            ['Starting', () => 'Starting application compute instance. You can navigate away and return in ~2 minutes.'],
            ['Stopped', () => 'Application compute instance is stopped. Start it or reload the page to continue.'],
            ['Error', () => 'Error with the application compute instance, please create a new one to continue.'],
            [null, () => 'Create an application compute instance to continue.'],
            [undefined, () => 'Loading...'],
            [Utils.DEFAULT, () => 'Unknown application compute instance status. Please create a new instance or contact support.']
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
    name: 'workspace-app-launch',
    path: '/workspaces/:namespace/:name/notebooks/:app',
    component: AppLauncher,
    title: ({ name, app }) => `${name} - ${app}`
  }
]
