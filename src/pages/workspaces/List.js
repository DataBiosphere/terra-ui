import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { Clickable, search, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { TopBar } from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  cardContainer: {
    position: 'relative',
    padding: '0 4rem',
    display: 'flex', flexWrap: 'wrap'
  },
  shortCard: {
    ...Style.elements.card,
    width: 300, height: 225,
    margin: '1rem 0.5rem'
  },
  shortWorkspaceCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  },
  shortTitle: {
    flex: 'none',
    color: colors.blue[0], fontSize: 16,
    lineHeight: '20px', height: '40px',
    overflow: 'hidden', wordWrap: 'break-word'
  },
  shortDescription: {
    flex: 'none',
    lineHeight: '18px', height: '90px',
    overflow: 'hidden'
  },
  shortCreateCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    color: colors.blue[0], fontSize: 20, lineHeight: '28px'
  },
  longCard: {
    ...Style.elements.card,
    width: '100%', minWidth: 0, height: 80,
    margin: '0.25rem 0.5rem'
  },
  longWorkspaceCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  },
  longTitle: {
    color: colors.blue[0], fontSize: 16,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
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
  },
  longCreateCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    color: colors.blue[0], fontSize: 16
  },
  toolbarContainer: {
    flex: 'none', display: 'flex', alignItems: 'flex-end',
    margin: '1rem 4.5rem'
  },
  toolbarButtons: {
    marginLeft: 'auto', display: 'flex',
    backgroundColor: 'white', borderRadius: 3
  },
  toolbarButton: active => ({
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '2.25rem', width: '3rem',
    color: active ? colors.blue[1] : colors.blue[0]
  })
}

const WorkspaceCard = pure(({ listView, workspace: { workspace: { namespace, name, createdBy, lastModified, attributes: { description } } } }) => {
  const lastChanged = `Last changed: ${Utils.makePrettyDate(lastModified)}`
  const badge = div({ title: createdBy, style: styles.badge }, [createdBy[0].toUpperCase()])
  const descText = description || span({ style: { color: colors.gray[2] } }, [
    'No description added'
  ])
  return listView ? a({
    href: Nav.getLink('workspace', { namespace, name }),
    style: { ...styles.longCard, ...styles.longWorkspaceCard }
  }, [
    div({ style: styles.longTitle }, [name]),
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      div({ style: styles.longDescription }, [descText]),
      h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
        div({ style: { flex: 'none', width: 170 } }, [lastChanged])
      ]),
      div({ style: { flex: 'none' } }, [badge])
    ])
  ]) : a({
    href: Nav.getLink('workspace', { namespace, name }),
    style: { ...styles.shortCard, ...styles.shortWorkspaceCard }
  }, [
    div({ style: styles.shortTitle }, [name]),
    div({ style: styles.shortDescription }, [descText]),
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
        div({ style: { flex: 1 } }, [lastChanged])
      ]),
      div({ style: { flex: 'none' } }, [badge])
    ])
  ])
})

const NewWorkspaceCard = pure(({ listView, onClick }) => {
  return listView ? h(Clickable, {
    style: { ...styles.longCard, ...styles.longCreateCard },
    onClick
  }, [
    div([
      'Create a New Workspace',
      icon('plus-circle', { style: { marginLeft: '1rem' }, size: 24 })
    ])
  ]) : h(Clickable, {
    style: { ...styles.shortCard, ...styles.shortCreateCard },
    onClick
  }, [
    div(['Create a']),
    div(['New Workspace']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 32 })
  ])
})

export const WorkspaceList = ajaxCaller(class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      listView: false,
      workspaces: null,
      creatingNewWorkspace: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { ajax: { Workspaces } } = this.props
    try {
      this.setState({ isDataLoaded: false })
      const workspaces = await Workspaces.list()
      this.setState({
        isDataLoaded: true,
        workspaces: _.flow(
          _.filter(ws => !ws.public || Utils.canRead(ws.accessLevel)),
          _.sortBy('workspace.name')
        )(workspaces)
      })
    } catch (error) {
      reportError('Error loading workspace list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { workspaces, isDataLoaded, filter, listView, creatingNewWorkspace } = this.state
    const data = _.filter(({ workspace: { namespace, name } }) => {
      return Utils.textMatch(filter, `${namespace}/${name}`)
    }, workspaces)
    return h(Fragment, [
      h(TopBar, { title: 'Workspaces' },
        [
          search({
            wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
            inputProps: {
              placeholder: 'SEARCH WORKSPACES',
              onChange: e => this.setState({ filter: e.target.value }),
              value: filter
            }
          })
        ]
      ),
      div({ style: styles.toolbarContainer }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
          'Workspaces'
        ]),
        div({ style: styles.toolbarButtons }, [
          h(Clickable, {
            style: styles.toolbarButton(!listView),
            onClick: () => this.setState({ listView: false })
          }, [icon('view-cards', { size: 24 })]),
          h(Clickable, {
            style: styles.toolbarButton(listView),
            onClick: () => this.setState({ listView: true })
          }, [icon('view-list', { size: 24 })])
        ])
      ]),
      div({ style: styles.cardContainer }, [
        h(NewWorkspaceCard, {
          listView,
          onClick: () => this.setState({ creatingNewWorkspace: true })
        }),
        _.map(workspace => {
          return h(WorkspaceCard, { listView, workspace, key: workspace.workspace.workspaceId })
        }, data),
        !isDataLoaded && spinnerOverlay
      ]),
      creatingNewWorkspace && h(NewWorkspaceModal, {
        onDismiss: () => this.setState({ creatingNewWorkspace: false })
      })
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['workspaces', 'filter', 'listView'],
      this.state)
    )
  }
})

export const addNavPaths = () => {
  Nav.defPath('root', {
    path: '/',
    component: () => h(Nav.Redirector, { pathname: '/workspaces' })
  })
  Nav.defPath('workspaces', {
    path: '/workspaces',
    component: WorkspaceList,
    title: 'Projects'
  })
}
