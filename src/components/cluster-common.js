import { useState } from 'react'
import { div } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { spinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


export const StatusMessage = ({ hideSpinner, children }) => {
  return div({ style: { padding: '1.5rem 2rem', display: 'flex' } }, [
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
      const currentStatus = currentCluster && status
      if (currentStatus === 'Stopped') {
        setBusy(true)
        await Ajax().Jupyter.cluster(googleProject, clusterName).start()
        await refreshClusters()
        setBusy(false)
        return
      } else if (currentStatus === undefined || currentStatus === 'Stopping') {
        await Utils.delay(500)
      } else if (currentStatus === null) {
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
