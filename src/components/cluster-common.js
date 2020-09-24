import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { b, div, h, p } from 'react-hyperscript-helpers'
import { Link, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import { collapsedClusterStatus, usableStatuses } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


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

  const startClusterOnce = withErrorReporting('Error starting cloud environment', async () => {
    while (!signal.aborted) {
      const currentCluster = getCluster()
      const { googleProject, runtimeName } = currentCluster || {}
      const status = collapsedClusterStatus(currentCluster)

      if (status === 'Stopped') {
        setBusy(true)
        await Ajax().Clusters.cluster(googleProject, runtimeName).start()
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
  const currentStatus = collapsedClusterStatus(cluster)
  const prevStatus = Utils.usePrevious(currentStatus)

  useEffect(() => {
    if (prevStatus === 'Running' && !_.includes(currentStatus, usableStatuses)) {
      onClusterStoppedRunning()
    } else if (prevStatus !== 'Running' && _.includes(currentStatus, usableStatuses)) {
      onClusterStartedRunning()
    }
  }, [currentStatus, onClusterStartedRunning, onClusterStoppedRunning, prevStatus])

  return null
}

export const PeriodicCookieSetter = ({ leading }) => {
  const signal = Utils.useCancellation()
  Utils.usePollingEffect(
    withErrorIgnoring(() => Ajax(signal).Clusters.setCookie()),
    { ms: 5 * 60 * 1000, leading }
  )
  return null
}

export const SaveFilesHelp = () => {
  return h(Fragment, [
    p([
      'If you want to save some files permanently, such as input data, analysis outputs, or installed packages, ',
      h(Link, {
        href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
        ...Utils.newTabLinkProps
      }, ['move them to the workspace bucket.'])
    ]),
    p(['Note: Jupyter notebooks are autosaved to the workspace bucket, and deleting your disk will not delete your notebooks.'])
  ])
}
