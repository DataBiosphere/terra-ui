import { isAfter, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import {
  ButtonPrimary, LabeledCheckbox, Link, makeMenuIcon, MenuButton, Select, TabBar, topSpinnerOverlay, transparentSpinnerOverlay
} from 'src/components/common'
import { icon } from 'src/components/icons'
import { SearchInput } from 'src/components/input'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import PopupTrigger from 'src/components/PopupTrigger'
import { List, Sortable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { useWorkspaces, WorkspaceTagSelect } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import { RequestAccessModal } from 'src/pages/workspaces/workspace/RequestAccessModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'


const styles = {
  cardContainer: listView => ({
    position: 'relative',
    display: 'flex', flexWrap: listView ? undefined : 'wrap',
    marginRight: listView ? undefined : '-1rem'
  }),
  shortCard: {
    ...Style.elements.card.container,
    width: 280, height: 260, position: 'relative',
    margin: '0 1rem 2rem 0'
  },
  shortTitle: {
    ...Style.elements.card.title,
    flex: 'none',
    fontWeight: 500,
    lineHeight: '20px', height: '40px',
    wordWrap: 'break-word'
  },
  shortDescription: {
    flex: 'none',
    whiteSpace: 'pre-wrap',
    lineHeight: '18px', height: '90px',
    overflow: 'hidden'
  },
  shortCreateCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    color: colors.accent(), fontSize: 20, fontWeight: 500, lineHeight: '28px'
  },
  longCard: {
    ...Style.elements.card.container,
    flexDirection: 'row',
    height: 80, position: 'relative',
    marginBottom: '0.5rem'
  },
  longCardTextContainer: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    width: '100%', minWidth: 0,
    marginLeft: '1rem'
  },
  longTitle: {
    ...Style.elements.card.title,
    ...Style.noWrapEllipsis, flex: 1
  },
  longDescription: {
    flex: 1,
    paddingRight: '1rem',
    ...Style.noWrapEllipsis
  },
  badge: {
    height: '1.5rem', width: '1.5rem', borderRadius: '1.5rem',
    lineHeight: '1.5rem', textAlign: 'center',
    backgroundColor: colors.dark(), color: 'white'
  },
  filter: { marginRight: '1rem', flex: '1 0 300px' },
  submissionIndicator: {
    position: 'absolute', top: 0, right: 0,
    color: 'white', display: 'flex', padding: 2, borderRadius: '0 5px'
  }
}

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
  const { query } = Nav.useRoute()
  const [filter, setFilter] = useState(query.filter || '')
  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState(false)
  const [cloningWorkspaceId, setCloningWorkspaceId] = useState()
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState()
  const [sharingWorkspaceId, setSharingWorkspaceId] = useState()
  const [requestingAccessWorkspaceId, setRequestingAccessWorkspaceId] = useState()
  const [accessLevelsFilter, setAccessLevelsFilter] = useState(query.accessLevelsFilter || [])
  const [projectsFilter, setProjectsFilter] = useState(query.projectsFilter || undefined)
  const [submissionsFilter, setSubmissionsFilter] = useState(query.submissionsFilter || [])
  const [includePublic, setIncludePublic] = useState(!!query.includePublic)
  const [tagsFilter, setTagsFilter] = useState(query.tagsFilter || [])
  const [sort, setSort] = useState({ field: 'name', direction: 'asc' })
  const [scrollbarSize, setScrollbarSize] = useState(0)

  useEffect(() => {
    // Note: setting undefined so that falsy values don't show up at all
    const newSearch = qs.stringify({
      ...query, filter: filter || undefined, accessLevelsFilter, projectsFilter, includePublic: includePublic || undefined, tagsFilter,
      submissionsFilter
    }, { addQueryPrefix: true })
    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch })
    }
  })

  const getWorkspace = id => _.find({ workspace: { workspaceId: id } }, workspaces)

  const initialFiltered = _.filter(ws => includePublic || !ws.public || Utils.canWrite(ws.accessLevel), workspaces)

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

  const filteredWorkspaces = _.flow(
    _.filter(ws => {
      const { workspace: { namespace, name, attributes } } = ws
      return Utils.textMatch(filter, `${namespace}/${name}`) &&
        (_.isEmpty(accessLevelsFilter) || accessLevelsFilter.includes(ws.accessLevel)) &&
        (_.isEmpty(projectsFilter) || projectsFilter === namespace) &&
        (_.isEmpty(submissionsFilter) || submissionsFilter.includes(workspaceSubmissionStatus(ws))) &&
        _.every(a => _.includes(a, _.get(['tag:tags', 'items'], attributes)), tagsFilter)
    }),
    _.orderBy([`workspace.${sort.field}`], [sort.direction])
  )(initialFiltered)

  const columnSizes = [{ flex: '2 0 300px' }, { flex: '1 0 150px' }, { flex: '1 0 150px' }, { flex: '0 0 30px' }]

  const renderedWorkspaces = h(Fragment, [
    div({ style: { display: 'flex', margin: '1rem 0 0.5rem', marginRight: scrollbarSize } }, _.map(([index, name]) => {
      return div({ style: { ...columnSizes[index] } }, [
        name && h(Sortable, { sort, field: name, onSort: setSort }, [Utils.normalizeLabel(name)])
      ])
    }, Utils.toIndexPairs(['name', 'lastModified', 'createdBy', undefined]))),
    h(AutoSizer, [
      ({ width, height }) => h(List, {
        width, height,
        onScrollbarPresenceChange: ({ vertical, size }) => setScrollbarSize(vertical ? size : 0),
        rowCount: filteredWorkspaces.length,
        noRowsRenderer: () => Utils.cond(
          [loadingWorkspaces, () => null],
          [_.isEmpty(initialFiltered), () => noWorkspacesMessage],
          () => div({ style: { fontStyle: 'italic' } }, ['No matching workspaces'])
        ),
        rowHeight: 70,
        rowRenderer: index => {
          const { accessLevel, workspace: { workspaceId, namespace, name, createdBy, lastModified, attributes: { description } }, ...workspace } = filteredWorkspaces[index]

          const onClone = () => setCloningWorkspaceId(workspaceId)
          const onDelete = () => setDeletingWorkspaceId(workspaceId)
          const onShare = () => setSharingWorkspaceId(workspaceId)
          const onRequestAccess = () => setRequestingAccessWorkspaceId(workspaceId)

          const canView = Utils.canRead(accessLevel)
          return div({
            style: {
              height: '100%', display: 'flex', flexDirection: 'column',
              padding: '0.5rem 0',
              borderTop: `1px solid ${colors.light()}`
            }
          }, [
            div({ style: { display: 'flex', flex: 1, alignItems: 'center' } }, [
              div({ style: { ...columnSizes[0], ...Style.noWrapEllipsis, marginRight: '1rem' } }, [
                h(Link, {
                  style: { color: canView ? undefined : colors.dark(0.7), fontWeight: 600 },
                  href: canView ? Nav.getLink('workspace-dashboard', { namespace, name }) : undefined,
                  onClick: !canView ? onRequestAccess : undefined,
                  tooltip: !canView &&
                    'You cannot access this workspace because it is protected by an Authorization Domain. Click to learn about gaining access.'
                }, [name])
              ]),
              div({ style: columnSizes[1] }, [
                h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [span([Utils.makeStandardDate(lastModified)])])
              ]),
              div({ style: columnSizes[2] }, [createdBy]),
              div({ style: columnSizes[3] }, [h(PopupTrigger, {
                side: 'left',
                closeOnClick: true,
                content: h(WorkspaceMenuContent, { namespace, name, onShare, onClone, onDelete })
              }, [
                h(Link, { 'aria-label': 'Workspace menu', onClick: e => e.preventDefault(), disabled: !canView }, [
                  icon('cardMenuIcon', { size: 20 })
                ])
              ])])
            ]),
            div({ style: { display: 'flex', flex: 1, alignItems: 'center' } }, [
              h(TooltipTrigger, {
                content: description && div({ style: { whiteSpace: 'pre-line' } }, [description])
              }, [
                div({ style: { color: description ? undefined : colors.dark(0.75) } }, [
                  description ? description.split('\n')[0] : 'No description added'
                ])
              ]),
              div({ style: { flex: 1 } }),
              div({ style: columnSizes[3] }, [
                Utils.switchCase(workspaceSubmissionStatus(workspace),
                  ['success', () => icon('success-standard', { size: 20, style: { color: colors.success() } })],
                  ['failure', () => icon('error-standard', { size: 20, style: { color: colors.danger(0.85) } })],
                  ['running', () => icon('sync', { size: 20, style: { color: colors.success() } })]
                )
              ])
            ])
          ])
        }
      })
    ])
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
    h(TabBar, {
      // activeTab: tabName,
      tabNames: ['mine', 'public', 'featured'],
      displayNames: { mine: 'my workspaces', public: 'public workspaces', featured: 'featured workspaces' },
      getHref: currentTab => `${Nav.getLink('workspaces')}${/*getUpdatedQuery({ newTab: currentTab })*/''}`,
      getOnClick: currentTab => e => {
        e.preventDefault()
        // updateQuery({ newTab: currentTab })
      }
    }, [
      h(ButtonPrimary, { onClick: () => setCreatingNewWorkspace(true) }, [
        icon('plus-circle', { style: { marginRight: '0.5rem' } }),
        'Create a New Workspace'
      ])
    ]),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' } }, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Filter Workspaces']),
        div([
          h(LabeledCheckbox, {
            checked: !!includePublic,
            onChange: setIncludePublic
          }, ' Show public workspaces')
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
            )(initialFiltered)
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
      div({ style: { flex: 1 } }, [renderedWorkspaces]),
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
