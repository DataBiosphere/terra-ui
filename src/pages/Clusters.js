import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { ClusterErrorModal, DeleteClusterModal } from 'src/components/ClusterManager'
import { Clickable, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { FlexTable, Sortable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import { clusterCost, currentCluster } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { delay, formatUSD, makeCompleteDate, useGetter, useOnMount, withBusyState } from 'src/libs/utils'


const Clusters = () => {
  const signal = useCancellation()
  const [clusters, setClusters] = useState()
  const [loading, setLoading] = useState(false)
  const [errorClusterId, setErrorClusterId] = useState()
  const getErrorClusterId = useGetter(errorClusterId)
  const [deleteClusterId, setDeleteClusterId] = useState()
  const getDeleteClusterId = useGetter(deleteClusterId)
  const [sort, setSort] = useState({ field: 'project', direction: 'asc' })

  const refreshClusters = withBusyState(setLoading, async () => {
    const newClusters = _.filter({ creator: getUser().email }, await Ajax(signal).Jupyter.clustersList())
    setClusters(newClusters)
    if (!_.some({ id: getErrorClusterId() }, newClusters)) {
      setErrorClusterId(undefined)
    }
    if (!_.some({ id: getDeleteClusterId() }, newClusters)) {
      setDeleteClusterId(undefined)
    }
  })
  const loadClusters = withErrorReporting('Error loading clusters', refreshClusters)
  const loadClustersSilently = withErrorIgnoring(refreshClusters)
  const pollClusters = async () => {
    while (true) {
      await delay(30000)
      await loadClustersSilently()
    }
  }
  useOnMount(() => {
    loadClusters()
    pollClusters()
  })

  const filteredClusters = _.orderBy([{
    project: 'googleProject',
    status: 'status',
    created: 'createdDate',
    accessed: 'dateAccessed',
    cost: clusterCost
  }[sort.field]], [sort.direction], clusters)

  const totalCost = _.sum(_.map(clusterCost, clusters))

  const clustersByProject = _.groupBy('googleProject', clusters)

  return h(Fragment, [
    h(TopBar, { title: 'Notebook runtimes', href: Nav.getLink('clusters') }),
    div({ role: 'main', style: { padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', marginBottom: '1rem' } }, ['Your notebook runtimes']),
      div({ style: { flex: 1 } }, [
        clusters && h(AutoSizer, [
          ({ width, height }) => h(FlexTable, {
            width, height, rowCount: filteredClusters.length,
            columns: [
              {
                headerRenderer: () => h(Sortable, { sort, field: 'project', onSort: setSort }, ['Billing project']),
                cellRenderer: ({ rowIndex }) => {
                  const cluster = filteredClusters[rowIndex]
                  const inactive = !_.includes(cluster.status, ['Deleting', 'Error']) &&
                    currentCluster(clustersByProject[cluster.googleProject]) !== cluster
                  return h(Fragment, [
                    cluster.googleProject,
                    inactive && h(TooltipTrigger, {
                      content: 'This billing project has multiple active runtime environments. Only the most recently created one will be used.'
                    }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.warning() } })])
                  ])
                }
              },
              {
                size: { basis: 150, grow: 0 },
                headerRenderer: () => h(Sortable, { sort, field: 'status', onSort: setSort }, ['Status']),
                cellRenderer: ({ rowIndex }) => {
                  const cluster = filteredClusters[rowIndex]
                  return h(Fragment, [
                    cluster.status,
                    cluster.status === 'Error' && h(Clickable, {
                      tooltip: 'View error',
                      'aria-label': 'View error',
                      onClick: () => setErrorClusterId(cluster.id)
                    }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })])
                  ])
                }
              },
              {
                size: { basis: 250, grow: 0 },
                headerRenderer: () => h(Sortable, { sort, field: 'created', onSort: setSort }, ['Created']),
                cellRenderer: ({ rowIndex }) => {
                  return makeCompleteDate(filteredClusters[rowIndex].createdDate)
                }
              },
              {
                size: { basis: 250, grow: 0 },
                headerRenderer: () => h(Sortable, { sort, field: 'accessed', onSort: setSort }, ['Last accessed']),
                cellRenderer: ({ rowIndex }) => {
                  return makeCompleteDate(filteredClusters[rowIndex].dateAccessed)
                }
              },
              {
                size: { basis: 240, grow: 0 },
                headerRenderer: () => {
                  return h(Sortable, { sort, field: 'cost', onSort: setSort }, [`Cost / hr (${formatUSD(totalCost)} total)`])
                },
                cellRenderer: ({ rowIndex }) => {
                  return formatUSD(clusterCost(filteredClusters[rowIndex]))
                }
              },
              {
                size: { basis: 50, grow: 0 },
                headerRenderer: () => null,
                cellRenderer: ({ rowIndex }) => {
                  const cluster = filteredClusters[rowIndex]
                  return h(Link, {
                    'aria-label': 'Delete notebook runtime',
                    tooltip: 'Delete notebook runtime',
                    onClick: () => setDeleteClusterId(cluster.id)
                  }, [icon('trash')])
                }
              }
            ]
          })
        ])
      ]),
      errorClusterId && h(ClusterErrorModal, {
        cluster: _.find({ id: errorClusterId }, clusters),
        onDismiss: () => setErrorClusterId(undefined)
      }),
      deleteClusterId && h(DeleteClusterModal, {
        cluster: _.find({ id: deleteClusterId }, clusters),
        onDismiss: () => setDeleteClusterId(undefined),
        onSuccess: () => {
          setDeleteClusterId(undefined)
          loadClusters()
        }
      }),
      loading && spinnerOverlay
    ])
  ])
}

export const navPaths = [
  {
    name: 'clusters',
    path: '/clusters',
    component: Clusters,
    title: 'Runtime environments'
  }
]
