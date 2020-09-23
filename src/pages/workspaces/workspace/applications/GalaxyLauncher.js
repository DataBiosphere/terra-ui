import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { GalaxyStatusMonitor, PeriodicCookieSetter, StatusMessage } from 'src/components/cluster-common'
import { spinnerOverlay } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { currentApp, usableStatuses } from 'src/libs/cluster-utils'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const GalaxyLauncher = _.flow(
  Utils.forwardRefWithName('GalaxyLauncher'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: _.get('app')
  })
)(({ apps }, ref) => {
  const [cookieReady, setCookieReady] = useState(false)
  const [busy, setBusy] = useState(false)

  const galaxyApp = currentApp(apps)
  console.log('GalaxyApp: ', galaxyApp)
  console.log('apps: ', apps)

  const galaxyAppStatus = galaxyApp && galaxyApp.status // preserve null vs undefined

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
    galaxyAppStatus === 'RUNNING' && cookieReady ?
      h(Fragment, [
        h(PeriodicCookieSetter),
        iframe({
          src: galaxyApp.proxyUrls.galaxy,
          style: {
            border: 'none', flex: 1
          },
          title: `Interactive Galaxy iframe`
        })
      ]) :
      div({ style: { padding: '2rem' } }, [
        !busy && h(StatusMessage, { hideSpinner: ['Error', 'Stopped', null].includes(galaxyAppStatus) }, [

          Utils.cond(
            [galaxyAppStatus === 'PROVISIONING', () => 'Creating Galaxy app.'],
            [_.includes(galaxyAppStatus, usableStatuses), () => 'Almost ready...'],
            [galaxyAppStatus === 'ERROR', () => 'Error with the Galaxy app, please try again.'],
            [galaxyAppStatus === null, () => 'Create a Galaxy app to continue.'],
            [galaxyAppStatus === undefined, () => 'Loading...'],
            () => 'Unknown Galaxy app status. Please create a new Galaxy app or contact support.'
          )
        ]),
        busy && spinnerOverlay
      ])
  ])
})


export const navPaths = [
  {
    name: 'workspace-galaxy-launch',
    path: '/workspaces/:namespace/:name/apps/galaxy', //TODO figure out the right path name for this
    component: GalaxyLauncher,
    title: ({ name, app }) => `${name} - ${app}`
  }
]
