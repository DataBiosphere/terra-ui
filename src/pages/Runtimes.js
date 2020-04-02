import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { Clickable, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { DeleteRuntimeModal, RuntimeErrorModal } from 'src/components/RuntimeManager'
import { FlexTable, Sortable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import { currentRuntime, runtimeCost } from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import { formatUSD, makeCompleteDate, useCancellation, useGetter, useOnMount, usePollingEffect, withBusyState } from 'src/libs/utils'


const Runtimes = () => {
  const signal = useCancellation()
  const [runtimes, setRuntimes] = useState()
  const [loading, setLoading] = useState(false)
  const [errorRuntimeId, setErrorRuntimeId] = useState()
  const getErrorRuntimeId = useGetter(errorRuntimeId)
  const [deleteRuntimeId, setDeleteRuntimeId] = useState()
  const getDeleteRuntimeId = useGetter(deleteRuntimeId)
  const [sort, setSort] = useState({ field: 'project', direction: 'asc' })

  const refreshRuntimes = withBusyState(setLoading, async () => {
    const newRuntimes = await Ajax(signal).Runtimes.list({ creator: getUser().email })
    setRuntimes(newRuntimes)
    if (!_.some({ id: getErrorRuntimeId() }, newRuntimes)) {
      setErrorRuntimeId(undefined)
    }
    if (!_.some({ id: getDeleteRuntimeId() }, newRuntimes)) {
      setDeleteRuntimeId(undefined)
    }
  })
  const loadRuntimes = withErrorReporting('Error loading notebook runtimes', refreshRuntimes)

  useOnMount(() => { loadRuntimes() })
  usePollingEffect(withErrorIgnoring(refreshRuntimes), { ms: 30000 })

  const filteredRuntimes = _.orderBy([{
    project: 'googleProject',
    status: 'status',
    created: 'createdDate',
    accessed: 'dateAccessed',
    cost: runtimeCost
  }[sort.field]], [sort.direction], runtimes)

  const totalCost = _.sum(_.map(runtimeCost, runtimes))

  const runtimesByProject = _.groupBy('googleProject', runtimes)

  return h(Fragment, [
    h(TopBar, { title: 'Notebook Runtimes' }),
    div({ role: 'main', style: { padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', marginBottom: '1rem' } }, ['Your notebook runtimes']),
      div({ style: { flex: 1 } }, [
        runtimes && h(AutoSizer, [
          ({ width, height }) => h(FlexTable, {
            width, height, rowCount: filteredRuntimes.length,
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
                      content: 'This billing project has multiple active runtime environments. Only the most recently created one will be used.'
                    }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.warning() } })])
                  ])
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
                    'aria-label': 'Delete notebook runtime',
                    tooltip: status === 'Creating' ? 'Cannot delete a runtime while it is being created' : 'Delete notebook runtime',
                    onClick: () => setDeleteRuntimeId(id)
                  }, [icon('trash')])
                }
              }
            ]
          })
        ])
      ]),
      errorRuntimeId && h(RuntimeErrorModal, {
        runtime: _.find({ id: errorRuntimeId }, runtimes),
        onDismiss: () => setErrorRuntimeId(undefined)
      }),
      deleteRuntimeId && h(DeleteRuntimeModal, {
        runtime: _.find({ id: deleteRuntimeId }, runtimes),
        onDismiss: () => setDeleteRuntimeId(undefined),
        onSuccess: () => {
          setDeleteRuntimeId(undefined)
          loadRuntimes()
        }
      }),
      loading && spinnerOverlay
    ])
  ])
}

export const navPaths = [
  {
    name: 'runtimes',
    path: '/runtimes',
    component: Runtimes,
    title: 'Runtime environments'
  }
]
