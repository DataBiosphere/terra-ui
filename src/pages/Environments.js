import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, p, span } from 'react-hyperscript-helpers'
import { Clickable, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { SaveFilesHelp } from 'src/components/runtime-common'
import { RuntimeErrorModal } from 'src/components/RuntimeManager'
import { SimpleFlexTable, Sortable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import { currentRuntime, persistentDiskCostMonthly, runtimeCost } from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import { cond, formatUSD, makeCompleteDate, useCancellation, useGetter, useOnMount, usePollingEffect, withBusyState } from 'src/libs/utils'


const DeleteRuntimeModal = ({ runtime: { googleProject, runtimeName, runtimeConfig: { persistentDiskId } }, onDismiss, onSuccess }) => {
  const [deleteDisk, setDeleteDisk] = useState(false)
  const [deleting, setDeleting] = useState()
  const deleteRuntime = _.flow(
    withBusyState(setDeleting),
    withErrorReporting('Error deleting cloud environment')
  )(async () => {
    await Ajax().Runtimes.runtime(googleProject, runtimeName).delete(deleteDisk)
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete cloud environment?',
    onDismiss,
    okButton: deleteRuntime
  }, [
    div({ style: { lineHeight: 1.5 } }, [
      persistentDiskId ?
        h(LabeledCheckbox, { checked: deleteDisk, onChange: setDeleteDisk }, [
          span({ style: { fontWeight: 600 } }, [' Also delete the persistent disk and all files on it'])
        ]) :
        p([
          'Deleting this cloud environment will also ', span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk.'])
        ]),
      h(SaveFilesHelp),
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
    h(SaveFilesHelp),
    busy && spinnerOverlay
  ])
}

const Environments = () => {
  const signal = useCancellation()
  const [runtimes, setRuntimes] = useState()
  const [disks, setDisks] = useState()
  const [loading, setLoading] = useState(false)
  const [errorRuntimeId, setErrorRuntimeId] = useState()
  const getErrorRuntimeId = useGetter(errorRuntimeId)
  const [deleteRuntimeId, setDeleteRuntimeId] = useState()
  const getDeleteRuntimeId = useGetter(deleteRuntimeId)
  const [deleteDiskId, setDeleteDiskId] = useState()
  const getDeleteDiskId = useGetter(deleteDiskId)
  const [sort, setSort] = useState({ field: 'project', direction: 'asc' })
  const [diskSort, setDiskSort] = useState({ field: 'project', direction: 'asc' })

  const refreshData = withBusyState(setLoading, async () => {
    const creator = getUser().email
    const [newRuntimes, newDisks, galaxyDisks] = await Promise.all([
      Ajax(signal).Runtimes.list({ creator }),
      Ajax(signal).Disks.list({ creator }),
      Ajax(signal).Disks.list({ creator, saturnApplication: 'galaxy' })
    ])
    const galaxyDiskNames = _.map(disk => disk.name, galaxyDisks)
    setRuntimes(newRuntimes)
    setDisks(_.remove(disk => _.includes(disk.name, galaxyDiskNames), newDisks))
    if (!_.some({ id: getErrorRuntimeId() }, newRuntimes)) {
      setErrorRuntimeId(undefined)
    }
    if (!_.some({ id: getDeleteRuntimeId() }, newRuntimes)) {
      setDeleteRuntimeId(undefined)
    }
    if (!_.some({ id: getDeleteDiskId() }, newDisks)) {
      setDeleteDiskId(undefined)
    }
  })

  const loadData = withErrorReporting('Error loading cloud environments', refreshData)

  useOnMount(() => { loadData() })
  usePollingEffect(withErrorIgnoring(refreshData), { ms: 30000 })

  const filteredRuntimes = _.orderBy([{
    project: 'googleProject',
    status: 'status',
    created: 'auditInfo.createdDate',
    accessed: 'auditInfo.dateAccessed',
    cost: runtimeCost
  }[sort.field]], [sort.direction], runtimes)

  const filteredDisks = _.orderBy([{
    project: 'googleProject',
    status: 'status',
    created: 'auditInfo.createdDate',
    accessed: 'auditInfo.dateAccessed',
    cost: persistentDiskCostMonthly,
    size: 'size'
  }[diskSort.field]], [diskSort.direction], disks)

  const totalCost = _.sum(_.map(runtimeCost, runtimes))
  const totalDiskCost = _.sum(_.map(persistentDiskCostMonthly, disks))

  const runtimesByProject = _.groupBy('googleProject', runtimes)
  const disksByProject = _.groupBy('googleProject', disks)

  return h(FooterWrapper, [
    h(TopBar, { title: 'Cloud Environments' }),
    div({ role: 'main', style: { padding: '1rem', flexGrow: 1 } }, [
      div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', marginBottom: '1rem' } }, ['Your cloud environments']),
      runtimes && h(SimpleFlexTable, {
        rowCount: filteredRuntimes.length,
        columns: [
          {
            headerRenderer: () => h(Sortable, { sort, field: 'project', onSort: setSort }, ['Billing project']),
            cellRenderer: ({ rowIndex }) => {
              const runtime = filteredRuntimes[rowIndex]
              const inactive = !_.includes(runtime.status, ['Deleting', 'Error']) &&
                currentRuntime(runtimesByProject[runtime.googleProject]) !== runtime
              return h(Fragment, [
                runtime.googleProject,
                inactive && h(TooltipTrigger, {
                  content: 'This billing project has multiple active cloud environments. Only the most recently created one will be used.'
                }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.warning() } })])
              ])
            }
          },
          {
            size: { basis: 90, grow: 0 },
            headerRenderer: () => 'Details',
            cellRenderer: ({ rowIndex }) => {
              const { runtimeName, runtimeConfig: { persistentDiskId } } = filteredRuntimes[rowIndex]
              const disk = _.find({ id: persistentDiskId }, disks)
              return h(PopupTrigger, {
                content: div({ style: { padding: '0.5rem' } }, [
                  div([span({ style: { fontWeight: '600' } }, ['Name: ']), runtimeName]),
                  disk && div([span({ style: { fontWeight: '600' } }, ['Persistent Disk: ']), disk.name])
                ])
              }, [h(Link, ['details'])])
            }
          },
          {
            size: { basis: 150, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'status', onSort: setSort }, ['Status']),
            cellRenderer: ({ rowIndex }) => {
              const runtime = filteredRuntimes[rowIndex]
              return h(Fragment, [
                runtime.status,
                runtime.status === 'Error' && h(Clickable, {
                  tooltip: 'View error',
                  'aria-label': 'View error',
                  onClick: () => setErrorRuntimeId(runtime.id)
                }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })])
              ])
            }
          },
          {
            size: { basis: 120, grow: 0.2 },
            headerRenderer: () => 'Location',
            cellRenderer: ({ rowIndex }) => {
              const { runtimeConfig: { zone } } = filteredRuntimes[rowIndex]
              return zone
            }
          },
          {
            size: { basis: 250, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'created', onSort: setSort }, ['Created']),
            cellRenderer: ({ rowIndex }) => {
              return makeCompleteDate(filteredRuntimes[rowIndex].auditInfo.createdDate)
            }
          },
          {
            size: { basis: 250, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'accessed', onSort: setSort }, ['Last accessed']),
            cellRenderer: ({ rowIndex }) => {
              return makeCompleteDate(filteredRuntimes[rowIndex].auditInfo.dateAccessed)
            }
          },
          {
            size: { basis: 240, grow: 0 },
            headerRenderer: () => {
              return h(Sortable, { sort, field: 'cost', onSort: setSort }, [`Cost / hr (${formatUSD(totalCost)} total)`])
            },
            cellRenderer: ({ rowIndex }) => {
              return formatUSD(runtimeCost(filteredRuntimes[rowIndex]))
            }
          },
          {
            size: { basis: 50, grow: 0 },
            headerRenderer: () => null,
            cellRenderer: ({ rowIndex }) => {
              const { id, status } = filteredRuntimes[rowIndex]
              return status !== 'Deleting' && h(Link, {
                disabled: status === 'Creating',
                'aria-label': 'Delete cloud environment',
                tooltip: status === 'Creating' ? 'Cannot delete a cloud environment while it is being created' : 'Delete cloud environment',
                onClick: () => setDeleteRuntimeId(id)
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
            size: { basis: 90, grow: 0 },
            headerRenderer: () => 'Details',
            cellRenderer: ({ rowIndex }) => {
              const { name, id } = filteredDisks[rowIndex]
              const runtime = _.find({ runtimeConfig: { persistentDiskId: id } }, runtimes)
              return h(PopupTrigger, {
                content: div({ style: { padding: '0.5rem' } }, [
                  div([span({ style: { fontWeight: 600 } }, ['Name: ']), name]),
                  runtime && div([span({ style: { fontWeight: 600 } }, ['Runtime: ']), runtime.runtimeName])
                ])
              }, [h(Link, ['details'])])
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
            size: { basis: 120, grow: 0.2 },
            headerRenderer: () => 'Location',
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              return disk.zone
            }
          },
          {
            size: { basis: 130, grow: 0 },
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'status', onSort: setDiskSort }, ['Status']),
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              return disk.status
            }
          },
          {
            size: { basis: 240, grow: 0 },
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'created', onSort: setDiskSort }, ['Created']),
            cellRenderer: ({ rowIndex }) => {
              return makeCompleteDate(filteredDisks[rowIndex].auditInfo.createdDate)
            }
          },
          {
            size: { basis: 240, grow: 0 },
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
              const error = cond(
                [status === 'Creating', () => 'Cannot delete this disk because it is still being created'],
                [_.some({ runtimeConfig: { persistentDiskId: id } }, runtimes), () => 'Cannot delete this disk because it is attached. You must delete the cloud environment first.']
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
      errorRuntimeId && h(RuntimeErrorModal, {
        runtime: _.find({ id: errorRuntimeId }, runtimes),
        onDismiss: () => setErrorRuntimeId(undefined)
      }),
      deleteRuntimeId && h(DeleteRuntimeModal, {
        runtime: _.find({ id: deleteRuntimeId }, runtimes),
        onDismiss: () => setDeleteRuntimeId(undefined),
        onSuccess: () => {
          setDeleteRuntimeId(undefined)
          loadData()
        }
      }),
      deleteDiskId && h(DeleteDiskModal, {
        disk: _.find({ id: deleteDiskId }, disks),
        onDismiss: () => setDeleteDiskId(undefined),
        onSuccess: () => {
          setDeleteDiskId(undefined)
          loadData()
        }
      }),
      loading && spinnerOverlay
    ])
  ])
}

export const navPaths = [
  {
    name: 'environments',
    path: '/clusters', // NB: This path name is a holdover from a previous naming scheme
    component: Environments,
    title: 'Cloud environments'
  }
]
