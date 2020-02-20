import { isAfter, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import {
  ButtonPrimary, Link, makeMenuIcon, MenuButton, Select, SimpleTabBar, topSpinnerOverlay, transparentSpinnerOverlay
} from 'src/components/common'
import { icon } from 'src/components/icons'
import { SearchInput } from 'src/components/input'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import PopupTrigger from 'src/components/PopupTrigger'
import { List, MiniSortable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { useWorkspaces, WorkspaceTagSelect } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import { RequestAccessModal } from 'src/pages/workspaces/workspace/RequestAccessModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'


const styles = { filter: { marginRight: '1rem', flex: '1 0 300px' } }

const workspaceSubmissionStatus = ({ workspaceSubmissionStats: { runningSubmissionsCount, lastSuccessDate, lastFailureDate } }) => {
  return Utils.cond(
    [runningSubmissionsCount, () => 'running'],
    [lastSuccessDate && (!lastFailureDate || isAfter(parseJSON(lastFailureDate), parseJSON(lastSuccessDate))), () => 'success'],
    [lastFailureDate, () => 'failure']
  )
}

const WorkspaceMenuContent = ({ namespace, name, onClone, onShare, onDelete }) => {
  const [workspace, setWorkspace] = useState(undefined)
  const signal = Utils.useCancellation()
  const loadWorkspace = withErrorReporting('Error loading workspace', async () => {
    setWorkspace(await Ajax(signal).Workspaces.workspace(namespace, name).details(['accessLevel', 'canShare']))
  })
  Utils.useOnMount(() => {
    loadWorkspace()
  })

  const canRead = workspace && Utils.canRead(workspace.accessLevel)
  const canShare = workspace && workspace.canShare
  const isOwner = workspace && Utils.isOwner(workspace.accessLevel)
  return h(Fragment, [
    h(MenuButton, {
      disabled: !canRead,
      tooltip: workspace && !canRead && 'You do not have access to the workspace Authorization Domain',
      tooltipSide: 'left',
      onClick: () => onClone()
    }, [makeMenuIcon('copy'), 'Clone']),
    h(MenuButton, {
      disabled: !canShare,
      tooltip: workspace && !canShare && 'You have not been granted permission to share this workspace',
      tooltipSide: 'left',
      onClick: () => onShare()
    }, [makeMenuIcon('share'), 'Share']),
    h(MenuButton, {
      disabled: !isOwner,
      tooltip: workspace && !isOwner && 'You must be an owner of this workspace or the underlying billing project',
      tooltipSide: 'left',
      onClick: () => onDelete()
    }, [makeMenuIcon('trash'), 'Delete'])
  ])
}

export const WorkspaceList = () => {
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces()
  const [featuredList, setFeaturedList] = useState()

  const { query } = Nav.useRoute()
  const [filter, setFilter] = useState(query.filter || '')
  const [accessLevelsFilter, setAccessLevelsFilter] = useState(query.accessLevelsFilter || [])
  const [projectsFilter, setProjectsFilter] = useState(query.projectsFilter || undefined)
  const [submissionsFilter, setSubmissionsFilter] = useState(query.submissionsFilter || [])
  const [tab, setTab] = useState(query.tab || 'my')
  const [tagsFilter, setTagsFilter] = useState(query.tagsFilter || [])

  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState(false)
  const [cloningWorkspaceId, setCloningWorkspaceId] = useState()
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState()
  const [sharingWorkspaceId, setSharingWorkspaceId] = useState()
  const [requestingAccessWorkspaceId, setRequestingAccessWorkspaceId] = useState()

  const [sort, setSort] = useState({ field: 'name', direction: 'asc' })
  const [scrollbarSize, setScrollbarSize] = useState(0)

  Utils.useOnMount(() => {
    const loadFeatured = async () => {
      setFeaturedList(await fetch(`${getConfig().firecloudBucketRoot}/featured-workspaces.json`).then(res => res.json()))
    }

    loadFeatured()
  })

  const getTabQuery = newTab => qs.stringify({
    ...query, filter: filter || undefined, accessLevelsFilter, projectsFilter, tab: newTab === 'my' ? undefined : newTab, tagsFilter,
    submissionsFilter
  }, { addQueryPrefix: true })


  useEffect(() => {
    // Note: setting undefined so that falsy values don't show up at all
    const newSearch = getTabQuery(tab)
    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch })
    }
  })

  const getWorkspace = id => _.find({ workspace: { workspaceId: id } }, workspaces)

  const initialFiltered = useMemo(() => ({
    my: _.filter(ws => !ws.public || Utils.canWrite(ws.accessLevel), workspaces),
    public: _.filter('public', workspaces),
    featured: _.flow(
      _.map(featuredWs => _.find({ workspace: featuredWs }, workspaces)),
      _.compact
    )(featuredList)
  }), [workspaces, featuredList])

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

  const sortedWorkspaces = _.orderBy([ws => sort.field === 'accessLevel' ? Utils.workspaceAccessLevels.indexOf(ws.accessLevel) : ws[sort.field]],
    [sort.direction], filteredWorkspaces[tab])

  const noWorkspacesMessage = div({ style: { fontSize: 20, margin: '1rem' } }, [
    div([
      'To get started, ', h(Link, { onClick: () => setCreatingNewWorkspace(true), style: { fontWeight: 600 } }, ['Create a New Workspace'])
    ]),
    div({ style: { marginTop: '1rem', fontSize: 16 } }, [
      h(Link, {
        ...Utils.newTabLinkProps,
        href: `https://support.terra.bio/hc/en-us/articles/360022716811`
      }, [`What's a workspace?`])
    ])
  ])

  const columnSizes = [
    { flex: '2 0 400px', marginRight: '2rem' },
    { flex: '1 0 100px', marginRight: '2rem' },
    { flex: '1 0 200px', marginRight: '2rem' },
    { flex: '1 0 120px', marginRight: '2rem' },
    { flex: '0 0 30px' }
  ]

  const makeColumnDiv = (index, children) => div({ style: { ...columnSizes[index], ...Style.noWrapEllipsis } }, children)

  const renderedWorkspaces = div({ style: { padding: '0 1rem', backgroundColor: 'white', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    div({ style: { display: 'flex', margin: '1rem 0 0.5rem', marginRight: scrollbarSize } }, _.map(([index, name]) => {
      return div({ style: { ...columnSizes[index] } }, [
        name && h(MiniSortable, { sort, field: name, onSort: setSort }, [div({ style: { fontWeight: 600 } }, [Utils.normalizeLabel(name)])])
      ])
    }, Utils.toIndexPairs(['name', 'lastModified', 'createdBy', 'accessLevel', undefined]))),
    div({ style: { flex: 1 } }, [h(AutoSizer, [
      ({ width, height }) => h(List, {
        width, height,
        onScrollbarPresenceChange: ({ vertical, size }) => setScrollbarSize(vertical ? size : 0),
        rowCount: sortedWorkspaces.length,
        noRowsRenderer: () => Utils.cond(
          [loadingWorkspaces, () => null],
          [_.isEmpty(workspaces), () => noWorkspacesMessage],
          () => div({ style: { fontStyle: 'italic' } }, ['No matching workspaces'])
        ),
        rowHeight: 70,
        rowRenderer: index => {
          const { accessLevel, workspace: { workspaceId, namespace, name, createdBy, lastModified, attributes: { description } }, ...workspace } = sortedWorkspaces[index]

          const onClone = () => setCloningWorkspaceId(workspaceId)
          const onDelete = () => setDeletingWorkspaceId(workspaceId)
          const onShare = () => setSharingWorkspaceId(workspaceId)
          const onRequestAccess = () => setRequestingAccessWorkspaceId(workspaceId)

          const canView = Utils.canRead(accessLevel)
          const lastRunStatus = workspaceSubmissionStatus(workspace)

          return div({
            style: {
              height: '100%', display: 'flex', flexDirection: 'column',
              padding: '0.5rem 0',
              borderTop: `1px solid ${colors.light()}`
            }
          }, [
            div({ style: { display: 'flex', flex: 1, alignItems: 'center' } }, [
              makeColumnDiv(0, [
                h(Link, {
                  style: { color: canView ? undefined : colors.dark(0.7), fontWeight: 600 },
                  href: canView ? Nav.getLink('workspace-dashboard', { namespace, name }) : undefined,
                  onClick: !canView ? onRequestAccess : undefined,
                  tooltip: !canView &&
                    'You cannot access this workspace because it is protected by an Authorization Domain. Click to learn about gaining access.',
                  tooltipSide: 'right'
                }, [name])
              ]),
              makeColumnDiv(1, [
                h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [span([Utils.makeStandardDate(lastModified)])])
              ]),
              makeColumnDiv(2, [createdBy]),
              makeColumnDiv(3, [Utils.normalizeLabel(accessLevel)]),
              makeColumnDiv(4, [h(PopupTrigger, {
                side: 'left',
                closeOnClick: true,
                content: h(WorkspaceMenuContent, { namespace, name, onShare, onClone, onDelete })
              }, [
                h(Link, { 'aria-label': 'Workspace menu', disabled: !canView }, [icon('cardMenuIcon', { size: 20 })])
              ])])
            ]),
            div({ style: { display: 'flex', flex: 1, alignItems: 'center' } }, [
              div({ style: { color: description ? undefined : colors.dark(0.75), marginRight: '1rem', ...Style.noWrapEllipsis } }, [
                description ? description.split('\n')[0] : 'No description added'
              ]),
              div({ style: { flex: 1 } }),
              makeColumnDiv(4, [
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
          ])
        }
      })
    ])])
  ])


  return h(Fragment, [
    h(TopBar, { title: 'Workspaces' }, [
      h(SearchInput, {
        style: { marginLeft: '2rem', width: 500 },
        placeholder: 'SEARCH WORKSPACES',
        'aria-label': 'Search workspaces',
        onChange: setFilter,
        value: filter
      })
    ]),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Workspaces']),
        h(ButtonPrimary, { onClick: () => setCreatingNewWorkspace(true) }, [
          icon('plus-circle', { style: { marginRight: '0.5rem' } }),
          'Create a New Workspace'
        ])
      ]),
      div({ style: { display: 'flex', marginBottom: '1rem' } }, [
        div({ style: styles.filter }, [
          h(WorkspaceTagSelect, {
            isClearable: true,
            isMulti: true,
            formatCreateLabel: _.identity,
            value: _.map(tag => ({ label: tag, value: tag }), tagsFilter),
            placeholder: 'Tags',
            'aria-label': 'Filter by tags',
            onChange: data => setTagsFilter(_.map('value', data))
          })
        ]),
        div({ style: { ...styles.filter, flexBasis: '250px' } }, [
          h(Select, {
            isClearable: true,
            isMulti: true,
            isSearchable: false,
            placeholder: 'Access levels',
            'aria-label': 'Filter by access levels',
            value: accessLevelsFilter,
            onChange: data => setAccessLevelsFilter(_.map('value', data)),
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
            onChange: data => setProjectsFilter(!!data ? data.value : undefined),
            options: _.flow(
              _.map('workspace.namespace'),
              _.uniq,
              _.sortBy(_.identity)
            )(workspaces)
          })
        ]),
        div({ style: { ...styles.filter, flexBasis: '220px' } }, [
          h(Select, {
            isClearable: true,
            isMulti: true,
            isSearchable: false,
            placeholder: 'Submission status',
            'aria-label': 'Filter by submission status',
            value: submissionsFilter,
            hideSelectedOptions: true,
            onChange: data => setSubmissionsFilter(_.map('value', data)),
            options: ['running', 'success', 'failure'],
            getOptionLabel: ({ value }) => Utils.normalizeLabel(value)
          })
        ])
      ]),
      h(SimpleTabBar, {
        value: tab,
        onChange: newTab => {
          if (newTab === tab) {
            refreshWorkspaces()
          } else {
            setTab(newTab)
          }
        },
        tabs: _.map(key => ({
          key,
          title: span({ style: { padding: '0 1rem' } }, [
            _.upperCase(`${key} workspaces`), ` (${loadingWorkspaces ? '...' : filteredWorkspaces[key].length})`
          ])
        }), ['my', 'public', 'featured'])
      }),
      renderedWorkspaces,
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
        onSuccess: () => refreshWorkspaces()
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
