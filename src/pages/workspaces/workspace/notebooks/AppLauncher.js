import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { PlaygroundHeader, StatusMessage } from 'src/components/cluster-common'
import { Link, spinnerOverlay } from 'src/components/common'
import { NewClusterModal } from 'src/components/NewClusterModal'
import { Ajax } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import { handleNonRunningCluster } from 'src/libs/cluster-utils'
import { reportError, withErrorReporting } from 'src/libs/error'
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
  const [cookieReady, setCookieReady] = useState(false)
  const [shownCreate, setShownCreate] = useState(false)
  const [busy, setBusy] = useState(false)
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
          const status = cluster?.status

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

  const clusterStatus = cluster && cluster.status

  return (cookieReady && clusterStatus === 'Running') ?
    h(Fragment, [
      app === 'RStudio' && h(PlaygroundHeader, [
        'This feature is in early development. Your R Code is saved on your compute instance but not to your workspace. We encourage you to frequently ',
        h(Link, {
          href: '', // TODO: put a link here
          ...Utils.newTabLinkProps
        }, ['back up your code manually']),
        '.'
      ]),
      iframe({
        src: `${cluster.clusterUrl}/${app === 'RStudio' ? '' : 'terminals/1'}`,
        ref: iframeRef,
        style: {
          border: 'none', flex: 1,
          ...(app === 'terminal' ? { marginTop: -45, clipPath: 'inset(45px 0 0)' } : {}) // cuts off the useless Jupyter top bar
        },
        title: `Interactive ${app} iframe`
      })
    ]) :
    div({ style: { padding: '2rem' } }, [
      h(StatusMessage, { hideSpinner: ['Error', 'Unknown', null].includes(clusterStatus) }, [Utils.switchCase(clusterStatus,
        ['Creating', () => 'Creating application compute instance. You can navigate away and return in 3-5 minutes.'],
        ['Stopping', () => 'Application compute instance is stopping, which takes ~4 minutes.'],
        ['Starting', () => 'Starting application compute instance. You can navigate away and return in ~2 minutes.'],
        ['Updating', () => 'Updating application compute instance. You can navigate away and return in 3-5 minutes.'],
        ['Deleting', () => 'Deleting application compute instance, you can create a new one after it finishes.'],
        ['Error', () => 'Error with the application compute instance, please try again.'],
        ['Unknown', () => 'Error with the application compute instance, please try again.'],
        [null, () => 'Create an application compute instance to continue.'],
        [Utils.DEFAULT, () => 'Getting ready...']
      )]),
      h(NewClusterModal, {
        isOpen: cluster === null && !shownCreate,
        namespace, currentCluster: cluster,
        onDismiss: () => setShownCreate(true),
        onSuccess: withErrorReporting('Error creating cluster', async promise => {
          setShownCreate(true)
          setBusy(true)
          await promise
          await refreshClusters()
          setBusy(false)
        })
      }),
      busy && spinnerOverlay
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
