import _ from 'lodash/fp'
import { useRef, useState } from 'react'
import { div, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import { handleNonRunningCluster } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const AppLauncher = _.flow(
  Utils.forwardRefWithName('AppLauncher'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: _.get('app'),
    activeTab: 'notebooks'
  })
)(({ namespace, refreshClusters, cluster, app }, ref) => {
  const signal = Utils.useCancellation()
  const { Clusters } = Ajax(signal)
  const [cookieReady, setCookieReady] = useState()
  const getCluster = Utils.useGetter(cluster)

  const cookieTimeout = useRef()
  const iframeRef = useRef()

  Utils.useOnMount(() => {
    const refreshCookie = async () => {
      const { expires_in: expiresInSec } = await Auth.reloadAuthToken() // give us max time until expiry, should be 1 hour

      cookieTimeout.current = setTimeout(refreshCookie, (expiresInSec - (15 * 60)) * 1000) // refresh 15 mins early

      await Clusters.notebooks(namespace, getCluster().clusterName).setCookie()
    }

    const startCluster = async () => {
      while (true) {
        try {
          await refreshClusters()
          const cluster = getCluster()
          const status = cluster?.status ?? cluster

          if (status === 'Running') {
            await refreshCookie()
            setCookieReady(true)
            iframeRef.current.onload = function() { this.contentWindow.focus() }
            return
          } else {
            await handleNonRunningCluster(cluster, Clusters)
          }
        } catch (error) {
          reportError(`Error launching ${app}`, error)
        }
      }
    }

    startCluster()
    return () => clearTimeout(cookieTimeout.current)
  })

  const clusterStatus = cluster?.status ?? cluster // preserving null vs undefined cluster value

  return (cookieReady && clusterStatus === 'Running') ?
    iframe({
      src: `${cluster?.clusterUrl}/${app === 'RStudio' ? '' : 'terminals/1'}`,
      ref: iframeRef,
      style: {
        border: 'none', flex: 1,
        ...(app === 'terminal' ? { marginTop: -45, clipPath: 'inset(45px 0 0)' } : {}) // cuts off the useless Jupyter top bar
      },
      title: `Interactive ${app} iframe`
    }) :
    div({ style: { padding: '2rem' } }, [
      !['Error', 'Unknown', undefined, null].includes(clusterStatus) && spinner({ style: { color: colors.primary(), marginRight: '0.5rem' } }),
      Utils.switchCase(clusterStatus,
        ['Creating', () => 'Creating application compute instance. You can navigate away and return in 3-5 minutes.'],
        ['Stopping', () => 'Application compute instance is stopping, which takes ~4 minutes.'],
        ['Starting', () => 'Starting application compute instance. You can navigate away and return in ~2 minutes.'],
        ['Updating', () => 'Updating application compute instance. You can navigate away and return in 3-5 minutes.'],
        ['Deleting', () => 'Deleting application compute instance, you can create a new one after it finishes.'],
        ['Error', () => 'Error with the application compute instance, please try again.'],
        ['Unknown', () => 'Error with the application compute instance, please try again.'],
        [null, () => 'Create an application compute instance to continue.'],
        [Utils.DEFAULT, () => 'Getting ready...']
      )
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
