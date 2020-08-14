import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, p, span } from 'react-hyperscript-helpers'
import { ClusterErrorModal } from 'src/components/ClusterManager'
import { Clickable, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { SimpleFlexTable, Sortable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import { clusterCost, currentCluster, persistentDiskCostMonthly } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import * as Style from 'src/libs/style'
import { cond, formatUSD, makeCompleteDate, newTabLinkProps, useCancellation, useGetter, useOnMount, usePollingEffect, withBusyState } from 'src/libs/utils'


const SaveNotice = () => {
  return p([
    'If you want to save some files permanently, such as input data, analysis outputs, or installed packages, ',
    h(Link, {
      href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
      ...newTabLinkProps
    }, ['move them to the workspace bucket.'])
  ])
}

const DeleteClusterModal = ({ cluster: { googleProject, runtimeName, runtimeConfig: { persistentDiskId } }, onDismiss, onSuccess }) => {
  const [deleteDisk, setDeleteDisk] = useState(false)
  const [deleting, setDeleting] = useState()
  const deleteCluster = _.flow(
    withBusyState(setDeleting),
    withErrorReporting('Error deleting cloud environment')
  )(async () => {
    await Ajax().Clusters.cluster(googleProject, runtimeName).delete(deleteDisk)
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete cloud environment?',
    onDismiss,
    okButton: deleteCluster
  }, [
    div({ style: { lineHeight: 1.5 } }, [
      persistentDiskId ?
        h(LabeledCheckbox, { checked: deleteDisk, onChange: setDeleteDisk }, [
          span({ style: { fontWeight: 600 } }, [' Also delete the persistent disk and all files on it'])
        ]) :
        p([
          'Deleting this cloud environment will also ', span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk.'])
        ]),
      h(SaveNotice),
      p([
        'Deleting your cloud environment will stop all running notebooks and associated costs. You can recreate your cloud environment later, ',
        'which will take several minutes.'
      ])
    ]),
    deleting && spinnerOverlay
  ])
}

const DeleteDiskModal = ({ disk: { googleProject, name }, onDismiss, onSuccess }) => {
  const [busy, setBusy] = useState(false)
  const deleteDisk = _.flow(
    withBusyState(setBusy),
    withErrorReporting('Error deleting persistent disk')
  )(async () => {
    await Ajax().Disks.disk(googleProject, name).delete()
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete persistent disk?',
    onDismiss,
    okButton: deleteDisk
  }, [
    p([
      'Deleting the persistent disk will ', span({ style: { fontWeight: 600 } }, ['delete all files on it.'])
    ]),
    h(SaveNotice),
    busy && spinnerOverlay
  ])
}

const Clusters = () => {
  const signal = useCancellation()
  const [clusters, setClusters] = useState()
  const [disks, setDisks] = useState()
  const [loading, setLoading] = useState(false)
  const [errorClusterId, setErrorClusterId] = useState()
  const getErrorClusterId = useGetter(errorClusterId)
  const [deleteClusterId, setDeleteClusterId] = useState()
  const getDeleteClusterId = useGetter(deleteClusterId)
  const [deleteDiskId, setDeleteDiskId] = useState()
  const getDeleteDiskId = useGetter(deleteDiskId)
  const [sort, setSort] = useState({ field: 'project', direction: 'asc' })
  const [diskSort, setDiskSort] = useState({ field: 'project', direction: 'asc' })

  const refreshClusters = withBusyState(setLoading, async () => {
    const creator = getUser().email
    const [newClusters, newDisks] = await Promise.all([
      Ajax(signal).Clusters.list({ creator }),
      Ajax(signal).Disks.list({ creator })
    ])
    setClusters(newClusters)
    setDisks(newDisks)
    if (!_.some({ id: getErrorClusterId() }, newClusters)) {
      setErrorClusterId(undefined)
    }
    if (!_.some({ id: getDeleteClusterId() }, newClusters)) {
      setDeleteClusterId(undefined)
    }
    if (!_.some({ id: getDeleteDiskId() }, newDisks)) {
      setDeleteDiskId(undefined)
    }
  })

  const loadClusters = withErrorReporting('Error loading cloud environments', refreshClusters)

  useOnMount(() => { loadClusters() })
  usePollingEffect(withErrorIgnoring(refreshClusters), { ms: 30000 })

  const filteredClusters = _.orderBy([{
    project: 'googleProject',
    status: 'status',
    created: 'auditInfo.createdDate',
    accessed: 'auditInfo.dateAccessed',
    cost: clusterCost
  }[sort.field]], [sort.direction], clusters)

  const filteredDisks = _.orderBy([{
    project: 'googleProject',
    status: 'status',
    created: 'auditInfo.createdDate',
    accessed: 'auditInfo.dateAccessed',
    cost: persistentDiskCostMonthly,
    size: 'size'
  }[diskSort.field]], [diskSort.direction], disks)

  const totalCost = _.sum(_.map(clusterCost, clusters))
  const totalDiskCost = _.sum(_.map(persistentDiskCostMonthly, disks))

  const clustersByProject = _.groupBy('googleProject', clusters)
  const disksByProject = _.groupBy('googleProject', disks)

  return h(FooterWrapper, [
    h(TopBar, { title: 'Cloud Environments' }),
    div({ role: 'main', style: { padding: '1rem', flexGrow: 1 } }, [
      div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', marginBottom: '1rem' } }, ['Your cloud environments']),
      clusters && h(SimpleFlexTable, {
        rowCount: filteredClusters.length,
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
                  content: 'This billing project has multiple active cloud environments. Only the most recently created one will be used.'
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
              return makeCompleteDate(filteredClusters[rowIndex].auditInfo.createdDate)
            }
          },
          {
            size: { basis: 250, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'accessed', onSort: setSort }, ['Last accessed']),
            cellRenderer: ({ rowIndex }) => {
              return makeCompleteDate(filteredClusters[rowIndex].auditInfo.dateAccessed)
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
              const { id, status } = filteredClusters[rowIndex]
              return status !== 'Deleting' && h(Link, {
                disabled: status === 'Creating',
                'aria-label': 'Delete cloud environment',
                tooltip: status === 'Creating' ? 'Cannot delete a cloud environment while it is being created' : 'Delete cloud environment',
                onClick: () => setDeleteClusterId(id)
              }, [icon('trash')])
            }
          }
        ]
      }),
      div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', margin: '1rem 0' } }, ['Your persistent disks']),
      disks && h(SimpleFlexTable, {
        rowCount: filteredDisks.length,
        columns: [
          {
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'project', onSort: setDiskSort }, ['Billing project']),
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              const multiple = _.remove({ status: 'Deleting' }, disksByProject[disk.googleProject]).length > 1
              return h(Fragment, [
                disk.googleProject,
                disk.status !== 'Deleting' && multiple && h(TooltipTrigger, {
                  content: 'This billing project has multiple active persistent disks. Only one will be used.'
                }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.warning() } })])
              ])
            }
          },
          {
            size: { basis: 120, grow: 0 },
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'size', onSort: setDiskSort }, ['Size (GB)']),
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              return disk.size
            }
          },
          {
            size: { basis: 150, grow: 0 },
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'status', onSort: setDiskSort }, ['Status']),
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              return disk.status
            }
          },
          {
            size: { basis: 250, grow: 0 },
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'created', onSort: setDiskSort }, ['Created']),
            cellRenderer: ({ rowIndex }) => {
              return makeCompleteDate(filteredDisks[rowIndex].auditInfo.createdDate)
            }
          },
          {
            size: { basis: 250, grow: 0 },
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'accessed', onSort: setDiskSort }, ['Last accessed']),
            cellRenderer: ({ rowIndex }) => {
              return makeCompleteDate(filteredDisks[rowIndex].auditInfo.dateAccessed)
            }
          },
          {
            size: { basis: 250, grow: 0 },
            headerRenderer: () => {
              return h(Sortable, { sort: diskSort, field: 'cost', onSort: setDiskSort }, [`Cost / month (${formatUSD(totalDiskCost)} total)`])
            },
            cellRenderer: ({ rowIndex }) => {
              return formatUSD(persistentDiskCostMonthly(filteredDisks[rowIndex]))
            }
          },
          {
            size: { basis: 50, grow: 0 },
            headerRenderer: () => null,
            cellRenderer: ({ rowIndex }) => {
              const { id, status } = filteredDisks[rowIndex]
              // TODO PD: there should be some way of identifying which disk is connected to which runtime
              const error = cond(
                [status === 'Creating', () => 'Cannot delete this disk because it is still being created'],
                [_.some({ runtimeConfig: { persistentDiskId: id } }, clusters), 'Cannot delete this disk because it is attached. You must delete the cloud environment first.']
              )
              return status !== 'Deleting' && h(Link, {
                'aria-label': 'Delete persistent disk',
                disabled: !!error,
                tooltip: error || 'Delete persistent disk',
                onClick: () => setDeleteDiskId(id)
              }, [icon('trash')])
            }
          }
        ]
      }),
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
      deleteDiskId && h(DeleteDiskModal, {
        disk: _.find({ id: deleteDiskId }, disks),
        onDismiss: () => setDeleteDiskId(undefined),
        onSuccess: () => {
          setDeleteDiskId(undefined)
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
    title: 'Cloud environments'
  }
]
