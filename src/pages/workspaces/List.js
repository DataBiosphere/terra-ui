import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import removeMd from 'remove-markdown'
import togglesListView from 'src/components/CardsListToggle'
import { Clickable, MenuButton, menuIcon, PageFadeBox, search, Select, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { withWorkspaces } from 'src/components/workspace-utils'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'


const styles = {
  cardContainer: listView => ({
    position: 'relative',
    display: 'flex', flexWrap: listView ? undefined : 'wrap',
    marginRight: listView ? undefined : '-1rem'
  }),
  shortCard: {
    ...Style.elements.card,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    width: 300, height: 225,
    margin: '0 1rem 2rem 0'
  },
  shortTitle: {
    flex: 'none',
    color: colors.blue[0], fontSize: 16,
    lineHeight: '20px', height: '40px',
    overflow: 'hidden', wordWrap: 'break-word'
  },
  shortDescription: {
    flex: 'none',
    whiteSpace: 'pre-wrap',
    lineHeight: '18px', height: '90px',
    overflow: 'hidden'
  },
  shortCreateCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    color: colors.blue[0], fontSize: 20, lineHeight: '28px'
  },
  longCard: {
    ...Style.elements.card,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    width: '100%', minWidth: 0, height: 80,
    marginBottom: '0.5rem'
  },
  longTitle: {
    color: colors.blue[0], fontSize: 16,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1
  },
  longDescription: {
    flex: 1,
    paddingRight: '1rem',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  badge: {
    height: '1.5rem', width: '1.5rem', borderRadius: '1.5rem',
    lineHeight: '1.5rem', textAlign: 'center',
    backgroundColor: colors.purple[0], color: 'white'
  }
}

const WorkspaceCard = pure(({
  listView, onClone, onDelete, onShare,
  workspace: { accessLevel, workspace: { namespace, name, createdBy, lastModified, attributes: { description } } }
}) => {
  const lastChanged = `Last changed: ${Utils.makePrettyDate(lastModified)}`
  const badge = div({ title: createdBy, style: styles.badge }, [createdBy[0].toUpperCase()])
  const isOwner = Utils.isOwner(accessLevel)
  const notAuthorized = (accessLevel === 'NO ACCESS')
  const workspaceMenu = h(PopupTrigger, {
    side: 'right',
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        disabled: notAuthorized,
        tooltip: notAuthorized && 'You do not have access to the workspace Authorization Domain',
        tooltipSide: 'left',
        onClick: () => onClone()
      }, [menuIcon('copy'), 'Clone']),
      h(MenuButton, {
        disabled: !isOwner,
        tooltip: !isOwner && 'You must be an owner of this workspace or the underlying billing project',
        tooltipSide: 'left',
        onClick: () => onShare()
      }, [menuIcon('share'), 'Share']),
      h(MenuButton, {
        disabled: !isOwner,
        tooltip: !isOwner && 'You must be an owner of this workspace or the underlying billing project',
        tooltipSide: 'left',
        onClick: () => onDelete()
      }, [menuIcon('trash'), 'Delete'])
    ])
  }, [
    h(Clickable, {
      onClick: e => e.preventDefault(),
      style: {
        cursor: 'pointer', color: colors.blue[0], marginRight: 'auto'
      },
      focus: 'hover',
      hover: { color: colors.blue[2] }
    }, [
      icon('cardMenuIcon', {
        size: listView ? 18 : 24
      })
    ])
  ])
  const descText = description ?
    removeMd(listView ? description.split('\n')[0] : description) :
    span({ style: { color: colors.gray[1] } }, ['No description added'])

  return listView ? a({
    href: Nav.getLink('workspace-dashboard', { namespace, name }),
    style: styles.longCard
  }, [
    div({ style: { display: 'flex', alignItems: 'center', marginTop: '.75rem' } }, [
      div({ style: { ...styles.longTitle, marginLeft: '2rem' } }, [name]),
      h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
        div({ style: { flex: 'none' } }, [lastChanged])
      ])
    ]),
    workspaceMenu,
    div({ style: { display: 'flex', alignItems: 'center', marginBottom: '.75rem' } }, [
      div({ style: { ...styles.longDescription, marginLeft: '2rem' } }, [descText]),
      div({ style: { flex: 'none' } }, [badge])
    ])
  ]) : a({
    href: Nav.getLink('workspace-dashboard', { namespace, name }),
    style: styles.shortCard
  }, [
    div({ style: styles.shortTitle }, [name]),
    div({ style: styles.shortDescription }, [descText]),
    div({ style: { display: 'flex', marginLeft: 'auto' } }, [badge]),
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
        div({ style: { flex: 1 } }, [lastChanged])
      ]),
      workspaceMenu
    ])
  ])
})

const NewWorkspaceCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: { ...styles.shortCard, ...styles.shortCreateCard },
    onClick, dataTestId: 'createNewWorkspace'
  }, [
    div(['Create a']),
    div(['New Workspace']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 32 })
  ])
})


export const WorkspaceList = _.flow(
  ajaxCaller,
  togglesListView('workspaceList'),
  withWorkspaces({ persist: true })
)(class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      creatingNewWorkspace: false,
      cloningWorkspaceId: undefined,
      deletingWorkspaceId: undefined,
      sharingWorkspaceId: undefined,
      accessLevelsFilter: [],
      projectsFilter: [],
      ...StateHistory.get()
    }
  }

  getWorkspace(id) {
    const { workspaces } = this.props
    return _.find({ workspace: { workspaceId: id } }, workspaces)
  }

  render() {
    const { workspaces, loadingWorkspaces, refreshWorkspaces, listView, viewToggleButtons } = this.props
    const { filter, creatingNewWorkspace, cloningWorkspaceId, deletingWorkspaceId, sharingWorkspaceId, accessLevelsFilter, projectsFilter } = this.state
    const initialFiltered = _.flow(
      _.filter(ws => {
        const { workspace: { namespace, name } } = ws
        return Utils.textMatch(filter, `${namespace}/${name}`) &&
          (!ws.public || Utils.canWrite(ws.accessLevel))
      }),
      _.sortBy('workspace.name')
    )(workspaces)
    const namespaceList = _.uniq(_.map('workspace.namespace', initialFiltered))
    const data = _.filter(ws => (_.isEmpty(accessLevelsFilter) || accessLevelsFilter.includes(ws.accessLevel)) &&
      (_.isEmpty(projectsFilter) || projectsFilter.includes(ws.workspace.namespace)),
    initialFiltered)

    const renderedWorkspaces = _.map(workspace => {
      return h(WorkspaceCard, {
        listView,
        onClone: () => this.setState({ cloningWorkspaceId: workspace.workspace.workspaceId }),
        onDelete: () => this.setState({ deletingWorkspaceId: workspace.workspace.workspaceId }),
        onShare: () => this.setState({ sharingWorkspaceId: workspace.workspace.workspaceId }),
        workspace, key: workspace.workspace.workspaceId
      })
    }, data)
    return h(Fragment, [
      h(TopBar, { title: 'Workspaces' }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH WORKSPACES',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      h(PageFadeBox, { style: { position: 'relative' } }, [
        div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Workspaces']),
          div({ style: { marginLeft: 'auto', flex: '0 0 300px' } }, [
            h(Select, {
              isClearable: true,
              isMulti: true,
              isSearchable: false,
              placeholder: 'Filter by access levels',
              value: accessLevelsFilter,
              onChange: data => this.setState({ accessLevelsFilter: _.map('value', data) }),
              options: _.drop(1, Utils.workspaceAccessLevels),
              getOptionLabel: ({ value }) => Utils.normalizeLabel(value)
            })
          ]),
          div({ style: { margin: '0 1rem', flex: '0 0 300px' } }, [
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
          viewToggleButtons
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
          namespace: this.getWorkspace(sharingWorkspaceId).workspace.namespace,
          name: this.getWorkspace(sharingWorkspaceId).workspace.name,
          onDismiss: () => { this.setState({ sharingWorkspaceId: undefined }) }
        }),
        loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay)
      ])
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['filter', 'accessLevelsFilter', 'projectsFilter'],
      this.state)
    )
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspaces', {
    path: '/workspaces',
    component: WorkspaceList,
    title: 'Workspaces'
  })
}
