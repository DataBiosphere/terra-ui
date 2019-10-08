import { isAfter, parseISO } from 'date-fns/fp'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, memo, useEffect, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import removeMd from 'remove-markdown'
import { useViewToggle, ViewToggleButtons } from 'src/components/CardsListToggle'
import {
  Clickable, LabeledCheckbox, Link, makeMenuIcon, MenuButton, PageBox, Select, topSpinnerOverlay, transparentSpinnerOverlay
} from 'src/components/common'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { useWorkspaces, WorkspaceTagSelect } from 'src/components/workspace-utils'
import { Ajax, useCancellation } from 'src/libs/ajax'
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
  filter: { marginLeft: '1rem', flex: '0 0 300px' },
  submissionIndicator: {
    position: 'absolute', top: 0, right: 0,
    color: 'white', display: 'flex', padding: 2, borderRadius: '0 5px'
  }
}

const workspaceSubmissionStatus = ({ workspaceSubmissionStats: { runningSubmissionsCount, lastSuccessDate, lastFailureDate } }) => {
  return Utils.cond(
    [runningSubmissionsCount, () => 'running'],
    [lastSuccessDate && (!lastFailureDate || isAfter(parseISO(lastFailureDate), parseISO(lastSuccessDate))), () => 'success'],
    [lastFailureDate, () => 'failure']
  )
}

const WorkspaceMenuContent = ({ namespace, name, onClone, onShare, onDelete }) => {
  const [workspace, setWorkspace] = useState(undefined)
  const signal = useCancellation()
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

const SubmissionIndicator = ({ shape, color }) => {
  return div({ style: { ...styles.submissionIndicator, backgroundColor: color } }, [
    icon(shape, { size: 14, style: { color: 'white' } })
  ])
}

const WorkspaceCard = _.flow(
  Utils.withDisplayName('WorkspaceCard'),
  memo
)(({
  listView, onClone, onDelete, onShare, onRequestAccess,
  workspace, workspace: { accessLevel, workspace: { namespace, name, createdBy, lastModified, attributes: { description } } }
}) => {
  const lastChanged = `Last changed: ${Utils.makePrettyDate(lastModified)}`
  const badge = div({ title: createdBy, style: styles.badge }, [createdBy[0].toUpperCase()])
  const canView = Utils.canRead(accessLevel)
  const workspaceMenu = h(PopupTrigger, {
    side: 'right',
    closeOnClick: true,
    content: h(WorkspaceMenuContent, { namespace, name, onShare, onClone, onDelete })
  }, [
    h(Link, { 'aria-label': 'Workspace menu', onClick: e => e.preventDefault(), disabled: !canView }, [
      icon('cardMenuIcon', {
        size: listView ? 18 : 24
      })
    ])
  ])
  const descText = description ?
    removeMd(listView ? description.split('\n')[0] : description) :
    span({ style: { color: colors.dark(0.85) } }, ['No description added'])
  const titleOverrides = !canView ? { color: colors.dark(0.7) } : {}

  return h(TooltipTrigger, {
    content: !canView && `
      You cannot access this workspace because it is protected by an Authorization Domain.
      Click to learn about gaining access.
    `,
    side: 'top'
  }, [
    h(Clickable, {
      href: canView ? Nav.getLink('workspace-dashboard', { namespace, name }) : undefined,
      onClick: !canView ? onRequestAccess : undefined,
      style: listView ? styles.longCard : styles.shortCard
    }, [
      Utils.switchCase(workspaceSubmissionStatus(workspace),
        ['success', () => h(SubmissionIndicator, { shape: 'success-standard', color: colors.success() })],
        ['failure', () => h(SubmissionIndicator, { shape: 'error-standard', color: colors.danger(0.85) })],
        ['running', () => h(SubmissionIndicator, { shape: 'sync', color: colors.success() })]
      ),
      listView ? h(Fragment, [
        workspaceMenu,
        div({ style: { ...styles.longCardTextContainer } }, [
          div({ style: { display: 'flex', alignItems: 'center' } }, [
            div({ style: { ...styles.longTitle, ...titleOverrides } }, [name]),
            h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
              div({ style: { flex: 'none' } }, [lastChanged])
            ])
          ]),
          div({ style: { display: 'flex', alignItems: 'center' } }, [
            div({ style: { ...styles.longDescription } }, [descText]),
            div({ style: { flex: 'none' } }, [badge])
          ])
        ])
      ]) : h(Fragment, [
        div({ style: { ...styles.shortTitle, ...titleOverrides } }, [name]),
        div({ style: styles.shortDescription }, [descText]),
        div({ style: { display: 'flex', marginLeft: 'auto' } }, [badge]),
        div({ style: { display: 'flex', alignItems: 'center' } }, [
          h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
            div({ style: { flex: 1 } }, [lastChanged])
          ]),
          workspaceMenu
        ])
      ])
    ])
  ])
})

const NewWorkspaceCard = ({ onClick }) => {
  return h(Clickable, {
    style: { ...styles.shortCard, ...styles.shortCreateCard },
    onClick
  }, [
    div(['Create a']),
    div(['New Workspace']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 32 })
  ])
}

export const WorkspaceList = () => {
  const [listView, setListView] = useViewToggle('workspaceList')
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

  useEffect(() => {
    // Note: setting undefined so that falsy values don't show up at all
    const newSearch = qs.stringify({ ...query, filter: filter || undefined, accessLevelsFilter, projectsFilter, includePublic: includePublic || undefined, tagsFilter, submissionsFilter }, { addQueryPrefix: true })
    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch })
    }
  })

  const getWorkspace = id => _.find({ workspace: { workspaceId: id } }, workspaces)

  const initialFiltered = _.filter(ws => includePublic || !ws.public || Utils.canWrite(ws.accessLevel), workspaces)
  const noWorkspaces = _.isEmpty(initialFiltered) && !loadingWorkspaces

  const returnTags = _.getOr([], ['tag:tags', 'items'])

  const noWorkspacesMessage = div({ style: { fontSize: 20, margin: '1rem' } }, [
    div([
      'To get started, click ', span({ style: { fontWeight: 600 } }, ['Create a New Workspace'])
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
      const { workspace: { namespace, name } } = ws
      return Utils.textMatch(filter, `${namespace}/${name}`) &&
        (_.isEmpty(accessLevelsFilter) || accessLevelsFilter.includes(ws.accessLevel)) &&
        (_.isEmpty(projectsFilter) || projectsFilter === namespace) &&
        (_.isEmpty(submissionsFilter) || submissionsFilter.includes(workspaceSubmissionStatus(ws))) &&
        (_.isEmpty(tagsFilter) || _.every(_.identity, _.map(a => returnTags(ws.workspace.attributes).includes(a), tagsFilter)))
    }),
    _.sortBy('workspace.name')
  )(initialFiltered)

  const renderedWorkspaces = noWorkspaces ? noWorkspacesMessage : _.map(workspace => {
    return h(WorkspaceCard, {
      listView,
      onClone: () => setCloningWorkspaceId(workspace.workspace.workspaceId),
      onDelete: () => setDeletingWorkspaceId(workspace.workspace.workspaceId),
      onShare: () => setSharingWorkspaceId(workspace.workspace.workspaceId),
      onRequestAccess: () => setRequestingAccessWorkspaceId(workspace.workspace.workspaceId),
      workspace, key: workspace.workspace.workspaceId
    })
  }, filteredWorkspaces)

  return h(Fragment, [
    h(TopBar, { title: 'Workspaces' }, [
      h(DelayedSearchInput, {
        style: { marginLeft: '2rem', width: 500 },
        placeholder: 'SEARCH WORKSPACES',
        'aria-label': 'Search workspaces',
        onChange: setFilter,
        value: filter
      })
    ]),
    h(PageBox, { role: 'main', style: { position: 'relative' } }, [
      div({ style: { display: 'flex', alignItems: 'center', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Workspaces']),
        div({ style: { marginLeft: 'auto', marginRight: '1rem' } }, [
          h(LabeledCheckbox, {
            checked: !!includePublic,
            onChange: setIncludePublic
          }, ' Show public workspaces')
        ]),
        h(ViewToggleButtons, { listView, setListView })
      ]),
      div({ style: { display: 'flex', marginBottom: '1rem' } }, [
        div({ style: { display: 'flex', alignItems: 'center', fontSize: '1rem' } }, ['Filter by']),
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
        div({ style: { ...styles.filter, flexBasis: '250px', minWidth: 0 } }, [
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
        div({ style: { ...styles.filter, flexBasis: '250px', minWidth: 0 } }, [
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
      div({ style: styles.cardContainer(listView) }, [
        h(NewWorkspaceCard, {
          onClick: () => setCreatingNewWorkspace(true)
        }),
        Utils.cond(
          [workspaces && _.isEmpty(initialFiltered), () => noWorkspacesMessage],
          [!_.isEmpty(initialFiltered) && _.isEmpty(filteredWorkspaces), () => {
            return div({ style: { fontStyle: 'italic' } }, ['No matching workspaces'])
          }],
          [listView, () => div({ style: { flex: 1, minWidth: 0 } }, [renderedWorkspaces])],
          () => renderedWorkspaces
        )
      ]),
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
