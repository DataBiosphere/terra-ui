import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import togglesListView from 'src/components/CardsListToggle'
import { Clickable, MenuButton, PageFadeBox, spinnerOverlay, menuIcon, link, methodLink } from 'src/components/common'
import { icon } from 'src/components/icons'
import PopupTrigger from 'src/components/PopupTrigger'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import DeleteToolModal from 'src/pages/workspaces/workspace/tools/DeleteToolModal'
import ExportToolModal from 'src/pages/workspaces/workspace/tools/ExportToolModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  cardContainer: listView => ({
    display: 'flex', flexWrap: 'wrap',
    marginRight: listView ? undefined : '-1rem'
  }),
  // Card's position: relative and the outer/inner styles are a little hack to fake nested links
  card: {
    ...Style.elements.card, position: 'relative'
  },
  outerLink: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0
  },
  innerContent: {
    position: 'relative', pointerEvents: 'none'
  },
  innerLink: {
    pointerEvents: 'auto'
  },
  // (end link hacks)
  shortCard: {
    width: 300, height: 125, margin: '0 1rem 2rem 0'
  },
  shortTitle: {
    flex: 1,
    color: colors.blue[0], fontSize: 16,
    lineHeight: '20px', height: '40px',
    overflow: 'hidden', overflowWrap: 'break-word'
  },
  shortDescription: {
    flex: 'none',
    lineHeight: '18px', height: '90px',
    overflow: 'hidden'
  },
  longMethodVersion: {
    marginRight: '1rem', width: 90,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  longCard: {
    width: '100%', minWidth: 0,
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
  }
}

const ToolCard = pure(({ listView, name, namespace, config, onCopy, onDelete }) => {
  const { namespace: workflowNamespace, name: workflowName, methodRepoMethod: { sourceRepo, methodVersion } } = config
  const toolCardMenu = h(PopupTrigger, {
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        onClick: () => onCopy()
      }, [menuIcon('copy'), 'Copy to Another Workspace']),
      h(MenuButton, {
        onClick: () => onDelete()
      }, [menuIcon('trash'), 'Delete'])
    ])
  }, [
    h(Clickable, {
      onClick: e => e.stopPropagation(),
      style: {
        cursor: 'pointer', color: colors.blue[0], ...styles.innerLink
      },
      focus: 'hover',
      hover: { color: colors.blue[2] }
    }, [
      icon('cardMenuIcon', {
        size: listView ? 18 : 24
      })
    ])
  ])
  const repoLink = link({
    href: methodLink(config),
    style: styles.innerLink,
    target: '_blank',
    onClick: e => e.stopPropagation()
  }, sourceRepo)

  const workflowLink = a({
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName }),
    style: styles.outerLink
  })

  return listView ?
    div({ style: { ...styles.card, ...styles.longCard } }, [
      workflowLink,
      div({ style: { ...styles.innerContent, display: 'flex', alignItems: 'center' } }, [
        div({ style: { marginRight: '1rem' } }, [toolCardMenu]),
        div({ style: styles.longTitle }, [workflowName]),
        div({ style: styles.longMethodVersion }, [`V. ${methodVersion}`]),
        div({ style: { flex: 'none', width: 130 } }, ['Source: ', repoLink])
      ])
    ]) :
    div({ style: { ...styles.card, ...styles.shortCard } }, [
      workflowLink,
      div({ style: { ...styles.innerContent, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' } }, [
        div({ style: styles.shortTitle }, [workflowName]),
        div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } }, [
          div([div([`V. ${methodVersion}`]), 'Source: ', repoLink]), toolCardMenu
        ])
      ])
    ])
})

export const Tools = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Tools', activeTab: 'tools'
  }),
  togglesListView('toolsTab'),
  ajaxCaller
)(class Tools extends Component {
  constructor(props) {
    super(props)
    this.state = StateHistory.get()
  }

  async refresh() {
    const { namespace, name, ajax: { Workspaces } } = this.props

    try {
      this.setState({ loading: true })
      const configs = await Workspaces.workspace(namespace, name).listMethodConfigs()
      this.setState({ configs })
    } catch (error) {
      reportError('Error loading configs', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  getConfig({ namespace, name }) {
    const { configs } = this.state
    return _.find({ namespace, name }, configs)
  }

  render() {
    const { namespace, name, listView, viewToggleButtons, workspace: { workspace } } = this.props
    const { loading, configs, copyingTool, deletingTool } = this.state
    return h(PageFadeBox, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Tools']),
        viewToggleButtons,
        copyingTool && h(ExportToolModal, {
          thisWorkspace: workspace, methodConfig: this.getConfig(copyingTool),
          onDismiss: () => this.setState({ copyingTool: undefined })
        }),
        deletingTool && h(DeleteToolModal, {
          workspace, methodConfig: this.getConfig(deletingTool),
          onDismiss: () => this.setState({ deletingTool: undefined }),
          onSuccess: () => {
            this.refresh()
            this.setState({ deletingTool: undefined })
          }
        })
      ]),
      div({ style: styles.cardContainer(listView) }, [
        _.map(config => {
          return h(ToolCard, {
            onCopy: () => this.setState({ copyingTool: { namespace: config.namespace, name: config.name } }),
            onDelete: () => this.setState({ deletingTool: { namespace: config.namespace, name: config.name } }),
            key: `${config.namespace}/${config.name}`, namespace, name, config, listView
          })
        }, configs),
        configs && !configs.length && div(['No tools added']),
        loading && spinnerOverlay
      ])
    ])
  }

  async componentDidMount() {
    this.refresh()
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(['configs'], this.state))
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: Tools,
    title: ({ name }) => `${name} - Tools`
  })
}
