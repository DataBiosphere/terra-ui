import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { b, div, h } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { usableStatuses } from 'src/libs/cluster-utils'


export const StatusMessage = ({ hideSpinner, children }) => {
  return div({ style: { paddingLeft: '2rem', display: 'flex', alignItems: 'center' } }, [
    !hideSpinner && spinner({ style: { marginRight: '0.5rem' } }),
    div([children])
  ])
}

export const ClusterKicker = ({ cluster, refreshClusters, onNullCluster }) => {
  const getCluster = Utils.useGetter(cluster)
  const signal = Utils.useCancellation()
  const [busy, setBusy] = useState()

  const startClusterOnce = withErrorReporting('Error starting notebook runtime', async () => {
    while (!signal.aborted) {
      const currentCluster = getCluster()
      const { status, googleProject, clusterName } = currentCluster || {}

      if (status === 'Stopped') {
        setBusy(true)
        await Ajax().Clusters.cluster(googleProject, clusterName).start()
        await refreshClusters()
        setBusy(false)
        return
      } else if (currentCluster === undefined || status === 'Stopping') {
        await Utils.delay(500)
      } else if (currentCluster === null) {
        onNullCluster()
        return
      } else {
        return
      }
    }
  })

  Utils.useOnMount(() => {
    startClusterOnce()
  })

  return busy ? spinnerOverlay : null
}

export const ApplicationHeader = ({ label, labelBgColor, bgColor, children }) => {
  return div({
    style: {
      backgroundColor: bgColor, display: 'flex', alignItems: 'center', borderBottom: `2px solid ${colors.dark(0.2)}`, whiteSpace: 'pre'
    }
  }, [
    b({ style: { backgroundColor: labelBgColor, padding: '0.75rem 2rem', alignSelf: 'stretch', display: 'flex', alignItems: 'center' } }, [label]),
    children
  ])
}

export const PlaygroundHeader = ({ children }) => {
  return h(ApplicationHeader, {
    label: 'PLAYGROUND MODE',
    labelBgColor: colors.warning(0.4),
    bgColor: colors.warning(0.25)
  }, [
    icon('warning-standard', { style: { color: colors.warning(), marginLeft: '1rem' } }),
    div({ style: { margin: '0.5rem 1rem', whiteSpace: 'initial' } }, [children])
  ])
}

export const ClusterStatusMonitor = ({ cluster, onClusterStoppedRunning = _.noop, onClusterStartedRunning = _.noop }) => {
  const currentStatus = cluster && cluster.status
  const prevStatus = Utils.usePrevious(currentStatus)

  useEffect(() => {
    if (prevStatus === 'Running' && !_.includes(currentStatus, usableStatuses)) {
      onClusterStoppedRunning()
    } else if (prevStatus !== 'Running' && !_.includes(currentStatus, usableStatuses)) {
      onClusterStartedRunning()
    }
  }, [currentStatus, onClusterStartedRunning, onClusterStoppedRunning, prevStatus])

  return null
}

export const PeriodicCookieSetter = ({ namespace, clusterName, leading }) => {
  const signal = Utils.useCancellation()
  Utils.usePollingEffect(
    withErrorIgnoring(() => Ajax(signal).Clusters.notebooks(namespace, clusterName).setCookie()),
    { ms: 15 * 60 * 1000, leading })
  return null
}
