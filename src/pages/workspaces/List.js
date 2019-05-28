import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import removeMd from 'remove-markdown'
import togglesListView from 'src/components/CardsListToggle'
import {
  Clickable, LabeledCheckbox, linkButton, MenuButton, menuIcon, PageBox, Select, topSpinnerOverlay, transparentSpinnerOverlay
} from 'src/components/common'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { withWorkspaces } from 'src/components/workspace-utils'
import { Ajax, ajaxCaller, useCancellation } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
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
    whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1
  },
  longDescription: {
    flex: 1,
    paddingRight: '1rem',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
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
    [lastSuccessDate && (!lastFailureDate || new Date(lastSuccessDate) > new Date(lastFailureDate)), () => 'success'],
    [lastFailureDate, () => 'failure'],
  )
}

const WorkspaceMenuContent = ({ namespace, name, onClone, onShare, onDelete }) => {
  const [workspace, setWorkspace] = useState(undefined)
  const signal = useCancellation()
  const loadWorkspace = withErrorReporting('Error loading workspace', async () => {
    setWorkspace(await Ajax(signal).Workspaces.workspace(namespace, name).details())
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
    }, [menuIcon('copy'), 'Clone']),
    h(MenuButton, {
      disabled: !canShare,
      tooltip: workspace && !canShare && 'You have not been granted permission to share this workspace',
      tooltipSide: 'left',
      onClick: () => onShare()
    }, [menuIcon('share'), 'Share']),
    h(MenuButton, {
      disabled: !isOwner,
      tooltip: workspace && !isOwner && 'You must be an owner of this workspace or the underlying billing project',
      tooltipSide: 'left',
      onClick: () => onDelete()
    }, [menuIcon('trash'), 'Delete'])
  ])
}

const SubmissionIndicator = ({ shape, color }) => {
  return div({ style: { ...styles.submissionIndicator, backgroundColor: color } }, [
    icon(shape, { size: 14, style: { color: 'white' } })
  ])
}

const WorkspaceCard = pure(({
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
    linkButton({
      as: 'div',
      onClick: e => e.preventDefault(),
      disabled: !canView
    }, [
      icon('cardMenuIcon', {
        size: listView ? 18 : 24
      })
    ])
  ])
  const descText = description ?
    removeMd(listView ? description.split('\n')[0] : description) :
    span({ style: { color: colors.dark(0.85) } }, ['No description added'])
  const titleOverrides = !canView ? { color: colors.dark(0.7) } : {}

  const renderCard = children => {
    const style = listView ? styles.longCard : styles.shortCard
    if (canView) {
      return a({
        href: Nav.getLink('workspace-dashboard', { namespace, name }),
        style
      }, children)
    } else {
      return h(Clickable, {
        as: 'a',
        onClick: onRequestAccess,
        style
      }, children)
    }
  }

  return h(TooltipTrigger, {
    content: !canView && `
      You cannot access this workspace because it is protected by an Authorization Domain.
      Click to learn about gaining access.
    `,
    side: 'top'
  }, [
    renderCard([
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

const NewWorkspaceCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: { ...styles.shortCard, ...styles.shortCreateCard },
    onClick
  }, [
    div(['Create a']),
    div(['New Workspace']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 32 })
  ])
})


export const WorkspaceList = _.flow(
  ajaxCaller,
  togglesListView('workspaceList'),
  withWorkspaces()
)(class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      creatingNewWorkspace: false,
      cloningWorkspaceId: undefined,
      deletingWorkspaceId: undefined,
      sharingWorkspaceId: undefined,
      requestingAccessWorkspaceId: undefined,
      accessLevelsFilter: [],
      projectsFilter: [],
      submissionsFilter: [],
      includePublic: false,
      tagsFilter: [],
      tagsList: [],
      ...StateHistory.get()
    }
  }

  getWorkspace(id) {
    const { workspaces } = this.props
    return _.find({ workspace: { workspaceId: id } }, workspaces)
  }

  async componentDidMount() {
    const { ajax: { Workspaces } } = this.props
    const allTags = await Workspaces.getTags()
    this.setState({ tagsList: _.map('tag', allTags) })
  }

  render() {
    const { workspaces, loadingWorkspaces, refreshWorkspaces, listView, viewToggleButtons } = this.props
    const { filter, creatingNewWorkspace, cloningWorkspaceId, deletingWorkspaceId, sharingWorkspaceId, requestingAccessWorkspaceId, accessLevelsFilter, projectsFilter, submissionsFilter, tagsFilter, tagsList, includePublic } = this.state
    const initialFiltered = _.filter(ws => {
      const { workspace: { namespace, name } } = ws
      return Utils.textMatch(filter, `${namespace}/${name}`) && (includePublic || !ws.public || Utils.canWrite(ws.accessLevel))
    }, workspaces)

    const namespaceList = _.flow(
      _.map('workspace.namespace'),
      _.uniq,
      _.sortBy(_.identity)
    )(initialFiltered)

    const returnTags = workspaceAttributes => {
      if (workspaceAttributes['tag:tags']) {
        return workspaceAttributes['tag:tags'].items
      } else {
        return []
      }
    }

    const data = _.flow(
      _.filter(ws => (_.isEmpty(accessLevelsFilter) || accessLevelsFilter.includes(ws.accessLevel)) &&
        (_.isEmpty(projectsFilter) || projectsFilter.includes(ws.workspace.namespace)) &&
        (_.isEmpty(submissionsFilter) || submissionsFilter.includes(workspaceSubmissionStatus(ws))) &&
        (_.isEmpty(tagsFilter) || _.every(_.identity, _.map(a => returnTags(ws.workspace.attributes).includes(a), tagsFilter)))),
      _.sortBy('workspace.name')
    )(initialFiltered)

    const renderedWorkspaces = _.map(workspace => {
      return h(WorkspaceCard, {
        listView,
        onClone: () => this.setState({ cloningWorkspaceId: workspace.workspace.workspaceId }),
        onDelete: () => this.setState({ deletingWorkspaceId: workspace.workspace.workspaceId }),
        onShare: () => this.setState({ sharingWorkspaceId: workspace.workspace.workspaceId }),
        onRequestAccess: () => this.setState({ requestingAccessWorkspaceId: workspace.workspace.workspaceId }),
        workspace, key: workspace.workspace.workspaceId
      })
    }, data)
    return h(Fragment, [
      h(TopBar, { title: 'Workspaces' }, [
        h(DelayedSearchInput, {
          style: { marginLeft: '2rem', width: 500 },
          placeholder: 'SEARCH WORKSPACES',
          onChange: v => this.setState({ filter: v }),
          defaultValue: filter
        })
      ]),
      h(PageBox, { style: { position: 'relative' } }, [
        div({ style: { display: 'flex', alignItems: 'center', marginBottom: '1rem' } }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Workspaces']),
          div({ style: { marginLeft: 'auto', marginRight: '1rem' } }, [
            h(LabeledCheckbox, {
              checked: includePublic === true,
              onChange: v => this.setState({ includePublic: v })
            }, ' Show public workspaces')
          ]),
          viewToggleButtons
        ]),
        div({ style: { display: 'flex', marginBottom: '1rem' } }, [
          div({ style: { ...styles.filter, marginLeft: 'auto' } }, [
            h(Select, {
              isClearable: true,
              isMulti: true,
              isSearchable: true,
              value: tagsFilter,
              hideSelectedOptions: true,
              placeholder: 'Filter by tags',
              onChange: data => this.setState({ tagsFilter: _.map('value', data) }),
              options: tagsList
            })
          ]),
          div({ style: styles.filter }, [
            h(Select, {
              isClearable: true,
              isMulti: true,
              isSearchable: false,
              placeholder: 'Filter by access levels',
              value: accessLevelsFilter,
              onChange: data => this.setState({ accessLevelsFilter: _.map('value', data) }),
              options: Utils.workspaceAccessLevels,
              getOptionLabel: ({ value }) => Utils.normalizeLabel(value)
            })
          ]),
          div({ style: styles.filter }, [
            h(Select, {
              isClearable: true,
              isMulti: false,
              placeholder: 'Filter by project',
              value: projectsFilter,
              hideSelectedOptions: true,
              onChange: selected => {
                const data = !!selected ? selected.value : undefined
                this.setState({ projectsFilter: data })
              },
              options: namespaceList
            })
          ]),
          div({ style: styles.filter }, [
            h(Select, {
              isClearable: true,
              isMulti: true,
              isSearchable: false,
              placeholder: 'Filter by submission status',
              value: submissionsFilter,
              hideSelectedOptions: true,
              onChange: data => this.setState({ submissionsFilter: _.map('value', data) }),
              options: ['running', 'success', 'failure'],
              getOptionLabel: ({ value }) => Utils.normalizeLabel(value)
            })
          ])
        ]),
        div({ style: styles.cardContainer(listView) }, [
          h(NewWorkspaceCard, {
            onClick: () => this.setState({ creatingNewWorkspace: true })
          }),
          listView ?
            div({ style: { flex: 1, minWidth: 0 } }, [
              renderedWorkspaces
            ]) : renderedWorkspaces
        ]),
        creatingNewWorkspace && h(NewWorkspaceModal, {
          onDismiss: () => this.setState({ creatingNewWorkspace: false }),
          onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name })
        }),
        cloningWorkspaceId && h(NewWorkspaceModal, {
          cloneWorkspace: this.getWorkspace(cloningWorkspaceId),
          onDismiss: () => this.setState({ cloningWorkspaceId: undefined }),
          onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name })
        }),
        deletingWorkspaceId && h(DeleteWorkspaceModal, {
          workspace: this.getWorkspace(deletingWorkspaceId),
          onDismiss: () => { this.setState({ deletingWorkspaceId: undefined }) },
          onSuccess: () => refreshWorkspaces()
        }),
        sharingWorkspaceId && h(ShareWorkspaceModal, {
          workspace: this.getWorkspace(sharingWorkspaceId),
          onDismiss: () => { this.setState({ sharingWorkspaceId: undefined }) }
        }),
        requestingAccessWorkspaceId && h(RequestAccessModal, {
          workspace: this.getWorkspace(requestingAccessWorkspaceId),
          onDismiss: () => { this.setState({ requestingAccessWorkspaceId: undefined }) }
        }),
        loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay)
      ])
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['filter', 'accessLevelsFilter', 'projectsFilter', 'includePublic', 'tagsFilter', 'submissionsFilter'],
      this.state)
    )
  }
})

export const navPaths = [
  {
    name: 'workspaces',
    path: '/workspaces',
    component: WorkspaceList,
    title: 'Workspaces'
  }
]
