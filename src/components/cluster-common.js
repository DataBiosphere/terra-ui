import { div } from 'react-hyperscript-helpers'
import { spinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import { handleNonRunningCluster } from 'src/libs/cluster-utils'
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

  const startClusterOnce = withErrorReporting('Error starting application instance', async () => {
    while (!signal.aborted) {
      const currentStatus = getCluster()?.status
      if (currentStatus === null) {
        onNullCluster()
        return
      } else {
        await handleNonRunningCluster(cluster, Ajax(signal).Clusters)
        await refreshClusters()
        return
      }
    }
  })

  Utils.useOnMount(() => {
    startClusterOnce()
  })

  return null
}
