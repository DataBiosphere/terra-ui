import { isAfter, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import { useEffect, useMemo, useState } from 'react'
import { div, h, p, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { HeaderRenderer, Link, Select, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common'
import DelayedRender from 'src/components/DelayedRender'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon, spinner } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { SimpleTabBar } from 'src/components/tabBars'
import { FlexTable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { NoWorkspacesMessage, useWorkspaces, WorkspaceTagSelect } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import LockWorkspaceModal from 'src/pages/workspaces/workspace/LockWorkspaceModal'
import { RequestAccessModal } from 'src/pages/workspaces/workspace/RequestAccessModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'
import WorkspaceMenu from 'src/pages/workspaces/workspace/WorkspaceMenu'


const styles = {
  tableCellContainer: {
    height: '100%', padding: '0.5rem 0', paddingRight: '2rem',
    borderTop: `1px solid ${colors.light()}`
  },
  tableCellContent: {
    height: '50%', display: 'flex', alignItems: 'center'
  },
  filter: { marginRight: '1rem', flex: '1 1 0', minWidth: 'max-content' }
}

const useWorkspacesWithSubmissionStats = () => {
  const { workspaces, loading: loadingWorkspaces, refresh } = useWorkspaces()

  const signal = useCancellation()
  const [loadingSubmissionStats, setLoadingSubmissionStats] = useState(true)
  const [submissionStats, setSubmissionStats] = useState(null)

  useEffect(() => {
    // After the inital load, workspaces are refreshed after deleting a workspace or locking a workspace.
    // We don't need to reload submission stats in those cases.
    if (workspaces && !submissionStats) {
      const loadSubmissionStats = _.flow(
        withErrorReporting('Error loading submission stats'),
        Utils.withBusyState(setLoadingSubmissionStats)
      )(async () => {
        const response = await Ajax(signal).Workspaces.list(['workspace.workspaceId', 'workspaceSubmissionStats'])
        setSubmissionStats(
          _.fromPairs(_.map(ws => [ws.workspace.workspaceId, ws.workspaceSubmissionStats], response))
        )
      })

      loadSubmissionStats()
    }
  }, [workspaces, submissionStats, signal])

  const workspacesWithSubmissionStats = useMemo(() => {
    return _.map(ws => _.set('workspaceSubmissionStats', _.get(ws.workspace.workspaceId, submissionStats), ws), workspaces)
  }, [workspaces, submissionStats])

  return { workspaces: workspacesWithSubmissionStats, refresh, loadingWorkspaces, loadingSubmissionStats }
}

const workspaceSubmissionStatus = workspace => {
  const { runningSubmissionsCount, lastSuccessDate, lastFailureDate } = _.getOr({}, 'workspaceSubmissionStats', workspace)
  return Utils.cond(
    [runningSubmissionsCount, () => 'running'],
    [lastSuccessDate && (!lastFailureDate || isAfter(parseJSON(lastFailureDate), parseJSON(lastSuccessDate))), () => 'success'],
    [lastFailureDate, () => 'failure']
  )
}

const EMPTY_LIST = []

export const WorkspaceList = () => {
  const { workspaces, refresh: refreshWorkspaces, loadingWorkspaces, loadingSubmissionStats } = useWorkspacesWithSubmissionStats()
  const [featuredList, setFeaturedList] = useState()

  const { query } = Nav.useRoute()
  const filter = query.filter || ''
  // Using the EMPTY_LIST constant as a default value instead of creating a new empty array on
  // each render avoids unnecessarily recomputing the memoized filteredWorkspaces value.
  const accessLevelsFilter = query.accessLevelsFilter || EMPTY_LIST
  const projectsFilter = query.projectsFilter || undefined
  const submissionsFilter = query.submissionsFilter || EMPTY_LIST
  const tab = query.tab || 'myWorkspaces'
  const tagsFilter = query.tagsFilter || EMPTY_LIST

  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState(false)
  const [cloningWorkspaceId, setCloningWorkspaceId] = useState()
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState()
  const [lockingWorkspaceId, setLockingWorkspaceId] = useState()
  const [sharingWorkspaceId, setSharingWorkspaceId] = useState()
  const [requestingAccessWorkspaceId, setRequestingAccessWorkspaceId] = useState()

  const [sort, setSort] = useState({ field: 'lastModified', direction: 'desc' })

  useOnMount(() => {
    const loadFeatured = async () => {
      setFeaturedList(await Ajax().FirecloudBucket.getFeaturedWorkspaces())
    }

    loadFeatured()
  })

  const getWorkspace = id => _.find({ workspace: { workspaceId: id } }, workspaces)

  const initialFiltered = useMemo(() => {
    const [newWsList, featuredWsList] = _.partition('isNew', featuredList)

    return {
      myWorkspaces: _.filter(ws => !ws.public || Utils.canWrite(ws.accessLevel), workspaces),
      public: _.filter('public', workspaces),
      newAndInteresting: _.flow(
        _.map(({ namespace, name }) => _.find({ workspace: { namespace, name } }, workspaces)),
        _.compact
      )(newWsList),
      featured: _.flow(
        _.map(({ namespace, name }) => _.find({ workspace: { namespace, name } }, workspaces)),
        _.compact
      )(featuredWsList)
    }
  }, [workspaces, featuredList])

  const filteredWorkspaces = useMemo(() => _.mapValues(
    _.filter(ws => {
      const { workspace: { namespace, name, attributes } } = ws
      return Utils.textMatch(filter, `${namespace}/${name}`) &&
        (_.isEmpty(accessLevelsFilter) || accessLevelsFilter.includes(ws.accessLevel)) &&
        (_.isEmpty(projectsFilter) || projectsFilter === namespace) &&
        (_.isEmpty(submissionsFilter) || submissionsFilter.includes(workspaceSubmissionStatus(ws))) &&
        _.every(a => _.includes(a, _.get(['tag:tags', 'items'], attributes)), tagsFilter)
    }),
    initialFiltered), [accessLevelsFilter, filter, initialFiltered, projectsFilter, submissionsFilter, tagsFilter])

  const sortedWorkspaces = _.orderBy(
    [sort.field === 'accessLevel' ? ws => -Utils.workspaceAccessLevels.indexOf(ws.accessLevel) : `workspace.${sort.field}`],
    [sort.direction],
    filteredWorkspaces[tab]
  )

  const tabs = _.map(key => ({
    key,
    title: span([
      _.upperCase(key), ` (${loadingWorkspaces ? '...' : filteredWorkspaces[key].length})`
    ]),
    tableName: _.lowerCase(key)
  }), ['myWorkspaces', 'newAndInteresting', 'featured', 'public'])

  const currentTab = _.find({ key: tab }, tabs)

  const makeHeaderRenderer = name => () => h(HeaderRenderer, { sort, name, onSort: setSort })

  const renderedWorkspaces = div({ style: { flex: 1, backgroundColor: 'white', padding: '0 1rem' } }, [h(AutoSizer, [
    ({ width, height }) => h(FlexTable, {
      'aria-label': currentTab?.tableName || 'workspaces',
      width, height,
      rowCount: sortedWorkspaces.length,
      noContentRenderer: () => Utils.cond(
        [loadingWorkspaces, () => 'Loading...'],
        [_.isEmpty(initialFiltered.myWorkspaces) && tab === 'myWorkspaces', () => NoWorkspacesMessage({
          onClick: () => setCreatingNewWorkspace(true)
        })],
        [!_.isEmpty(submissionsFilter) && loadingSubmissionStats, () => 'Loading submission statuses...'],
        () => div({ style: { fontStyle: 'italic' } }, ['No matching workspaces'])
      ),
      variant: 'light',
      rowHeight: 70,
      sort,
      columns: [
        {
          field: 'name',
          headerRenderer: makeHeaderRenderer('name'),
          cellRenderer: ({ rowIndex }) => {
            const { accessLevel, workspace: { workspaceId, namespace, name, attributes: { description } } } = sortedWorkspaces[rowIndex]
            const canView = Utils.canRead(accessLevel)
            const canAccessWorkspace = () => !canView ? setRequestingAccessWorkspaceId(workspaceId) : undefined

            return div({ style: styles.tableCellContainer }, [
              div({ style: styles.tableCellContent }, [
                h(Link, {
                  'aria-haspopup': canView ? undefined : 'dialog',
                  style: {
                    ...(canView ? {} : { color: colors.dark(0.8), fontStyle: 'italic' }),
                    fontWeight: 600, fontSize: 16, ...Style.noWrapEllipsis
                  },
                  href: canView ? Nav.getLink('workspace-dashboard', { namespace, name }) : undefined,
                  onClick: () => {
                    canAccessWorkspace()
                    !!canView && Ajax().Metrics.captureEvent(Events.workspaceOpenFromList, { workspaceName: name, workspaceNamespace: namespace })
                  },
                  tooltip: !canView &&
                    'You cannot access this workspace because it is protected by an Authorization Domain. Click to learn about gaining access.',
                  tooltipSide: 'right'
                }, [name])
              ]),
              div({ style: styles.tableCellContent }, [
                span({ style: { ...Style.noWrapEllipsis, color: !!description ? undefined : colors.dark(0.75) } }, [
                  description?.toString().split('\n')[0] || 'No description added'
                ])
              ])
            ])
          },
          size: { basis: 400, grow: 2, shrink: 0 }
        }, {
          field: 'lastModified',
          headerRenderer: makeHeaderRenderer('lastModified'),
          cellRenderer: ({ rowIndex }) => {
            const { workspace: { lastModified } } = sortedWorkspaces[rowIndex]

            return div({ style: styles.tableCellContainer }, [
              div({ style: styles.tableCellContent }, [
                h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [div([Utils.makeStandardDate(lastModified)])])
              ])
            ])
          },
          size: { basis: 100, grow: 1, shrink: 0 }
        }, {
          field: 'createdBy',
          headerRenderer: makeHeaderRenderer('createdBy'),
          cellRenderer: ({ rowIndex }) => {
            const { workspace: { createdBy } } = sortedWorkspaces[rowIndex]

            return div({ style: styles.tableCellContainer }, [
              div({ style: styles.tableCellContent }, [span({ style: Style.noWrapEllipsis }, [createdBy])])
            ])
          },
          size: { basis: 200, grow: 1, shrink: 0 }
        }, {
          field: 'accessLevel',
          headerRenderer: makeHeaderRenderer('accessLevel'),
          cellRenderer: ({ rowIndex }) => {
            const { accessLevel } = sortedWorkspaces[rowIndex]

            return div({ style: styles.tableCellContainer }, [
              div({ style: styles.tableCellContent }, [Utils.normalizeLabel(accessLevel)])
            ])
          },
          size: { basis: 120, grow: 1, shrink: 0 }
        }, {
          headerRenderer: () => div({ className: 'sr-only' }, ['Actions']),
          cellRenderer: ({ rowIndex }) => {
            const { accessLevel, workspace: { workspaceId, namespace, name }, ...workspace } = sortedWorkspaces[rowIndex]
            if (!Utils.canRead(accessLevel)) {
              // No menu shown if user does not have read acccess.
              return null
            }
            const onClone = () => setCloningWorkspaceId(workspaceId)
            const onDelete = () => setDeletingWorkspaceId(workspaceId)
            const onLock = () => setLockingWorkspaceId(workspaceId)
            const onShare = () => setSharingWorkspaceId(workspaceId)
            const lastRunStatus = workspaceSubmissionStatus(workspace)

            return div({ style: { ...styles.tableCellContainer, paddingRight: 0 } }, [
              div({ style: styles.tableCellContent }, [
                h(WorkspaceMenu, {
                  iconSize: 20, popupLocation: 'left',
                  callbacks: { onClone, onShare, onLock, onDelete },
                  workspaceInfo: { namespace, name }
                })
              ]),
              div({ style: styles.tableCellContent }, [
                loadingSubmissionStats && h(DelayedRender, [
                  h(TooltipTrigger, {
                    content: 'Loading submission status',
                    side: 'left'
                  }, [spinner({ size: 20 })])
                ]),
                !!lastRunStatus && h(TooltipTrigger, {
                  content: span(['Last submitted workflow status: ', span({ style: { fontWeight: 600 } }, [_.startCase(lastRunStatus)])]),
                  side: 'left'
                }, [
                  Utils.switchCase(lastRunStatus,
                    ['success', () => icon('success-standard', { size: 20, style: { color: colors.success() } })],
                    ['failure', () => icon('error-standard', { size: 20, style: { color: colors.danger(0.85) } })],
                    ['running', () => icon('sync', { size: 20, style: { color: colors.success() } })]
                  )
                ])
              ])
            ])
          },
          size: { basis: 30, grow: 0, shrink: 0 }
        }
      ]
    })
  ])])


  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspaces' }),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, fontSize: '1.5rem' } }, ['Workspaces']),
        h(Link, {
          onClick: () => setCreatingNewWorkspace(true),
          style: { marginLeft: '0.5rem' },
          tooltip: 'Create a new workspace'
        },
        [icon('lighter-plus-circle', { size: 24 })])
      ]),
      p({ style: { margin: '0 0 1rem' } }, [
        'Dedicated spaces for you and your collaborators to access and analyze data together. ',
        h(Link, {
          ...Utils.newTabLinkProps,
          href: 'https://support.terra.bio/hc/en-us/articles/360024743371-Working-with-workspaces'
        }, ['Learn more about workspaces.'])
      ]),
      div({ style: { display: 'flex', marginBottom: '1rem' } }, [
        div({ style: { ...styles.filter, flexGrow: 1.5 } }, [
          h(DelayedSearchInput, {
            placeholder: 'Search by keyword',
            'aria-label': 'Search workspaces by keyword',
            onChange: newFilter => Nav.updateSearch({ ...query, filter: newFilter || undefined }),
            value: filter
          })
        ]),
        div({ style: styles.filter }, [
          h(WorkspaceTagSelect, {
            isClearable: true,
            isMulti: true,
            formatCreateLabel: _.identity,
            value: _.map(tag => ({ label: tag, value: tag }), tagsFilter),
            placeholder: 'Tags',
            'aria-label': 'Filter by tags',
            onChange: data => Nav.updateSearch({ ...query, tagsFilter: _.map('value', data) })
          })
        ]),
        div({ style: styles.filter }, [
          h(Select, {
            isClearable: true,
            isMulti: true,
            isSearchable: false,
            placeholder: 'Access levels',
            'aria-label': 'Filter by access levels',
            value: accessLevelsFilter,
            onChange: data => Nav.updateSearch({ ...query, accessLevelsFilter: _.map('value', data) }),
            options: Utils.workspaceAccessLevels,
            getOptionLabel: ({ value }) => Utils.normalizeLabel(value)
          })
        ]),
        div({ style: styles.filter }, [
          h(Select, {
            isClearable: true,
            isMulti: false,
            placeholder: 'Billing project',
            'aria-label': 'Filter by billing project',
            value: projectsFilter,
            hideSelectedOptions: true,
            onChange: data => Nav.updateSearch({ ...query, projectsFilter: data?.value || undefined }),
            options: _.flow(
              _.map('workspace.namespace'),
              _.uniq,
              _.sortBy(_.identity)
            )(workspaces)
          })
        ]),
        div({ style: { ...styles.filter, marginRight: 0 } }, [
          h(Select, {
            isClearable: true,
            isMulti: true,
            isSearchable: false,
            placeholder: 'Submission status',
            'aria-label': 'Filter by submission status',
            value: submissionsFilter,
            hideSelectedOptions: true,
            onChange: data => Nav.updateSearch({ ...query, submissionsFilter: _.map('value', data) }),
            options: ['running', 'success', 'failure'],
            getOptionLabel: ({ value }) => Utils.normalizeLabel(value)
          })
        ])
      ]),
      h(SimpleTabBar, {
        'aria-label': 'choose a workspace collection',
        value: tab,
        onChange: newTab => {
          if (newTab === tab) {
            refreshWorkspaces()
          } else {
            Nav.updateSearch({ ...query, tab: newTab === 'myWorkspaces' ? undefined : newTab })
          }
        },
        tabs
      }, [renderedWorkspaces]),
      creatingNewWorkspace && h(NewWorkspaceModal, {
        onDismiss: () => setCreatingNewWorkspace(false),
        onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name })
      }),
      cloningWorkspaceId && h(NewWorkspaceModal, {
        cloneWorkspace: getWorkspace(cloningWorkspaceId),
        onDismiss: () => setCloningWorkspaceId(undefined),
        onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name })
      }),
      deletingWorkspaceId && h(DeleteWorkspaceModal, {
        workspace: getWorkspace(deletingWorkspaceId),
        onDismiss: () => setDeletingWorkspaceId(undefined),
        onSuccess: refreshWorkspaces
      }),
      lockingWorkspaceId && h(LockWorkspaceModal, {
        workspace: getWorkspace(lockingWorkspaceId),
        onDismiss: () => setLockingWorkspaceId(undefined),
        onSuccess: refreshWorkspaces
      }),
      sharingWorkspaceId && h(ShareWorkspaceModal, {
        workspace: getWorkspace(sharingWorkspaceId),
        onDismiss: () => setSharingWorkspaceId(undefined)
      }),
      requestingAccessWorkspaceId && h(RequestAccessModal, {
        workspace: getWorkspace(requestingAccessWorkspaceId),
        onDismiss: () => setRequestingAccessWorkspaceId(undefined)
      }),
      loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay)
    ])
  ])
}

export const navPaths = [
  {
    name: 'workspaces',
    path: '/workspaces',
    component: WorkspaceList,
    title: 'Workspaces'
  }
]
