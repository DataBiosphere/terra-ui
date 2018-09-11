import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { Clickable, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  cardContainer: {
    padding: '1rem 4rem',
    display: 'flex', flexWrap: 'wrap'
  },
  shortCard: {
    ...Style.elements.card, width: 300, height: 125, margin: '1rem 0.5rem',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
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
  /*
   *shortCreateCard: {
   *  display: 'flex', flexDirection: 'column', justifyContent: 'center',
   *  color: colors.blue[0], fontSize: 20, lineHeight: '28px'
   *},
   */ //TODO: add short create card
  longCard: {
    ...Style.elements.card,
    width: '100%', minWidth: 0,
    margin: '0.25rem 0.5rem'
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
  /*
   *longCreateCard: {
   *display: 'flex', flexDirection: 'column', justifyContent: 'center',
   *color: colors.blue[0], fontSize: 16
   *}
   */ //TODO: Add long create card
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

const ToolCard = pure(({ listView, name, namespace, config }) => {
  const { namespace: workflowNamespace, name: workflowName, methodRepoMethod: { sourceRepo, methodVersion } } = config
  return listView ? a({
    style: styles.longCard,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName })
  }, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      div({ style: styles.longTitle }, [workflowName]),
      div({style: { marginRight: '1rem' } }, [`V. ${methodVersion}`]),
      div({ style: { flex: 'none' } }, [`Source: ${sourceRepo}`])
    ])
    // TODO: add tool description
  ]) : a({
    style: styles.shortCard,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName })
  }, [
    div({ style: styles.shortTitle }, [workflowName]),
    // TODO: add tool description
    div([`V. ${methodVersion}`]),
    div([`Source: ${sourceRepo}`])
  ])
})

export const WorkspaceTools = ajaxCaller(wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Tools', activeTab: 'tools'
},
class ToolsContent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      listView: false,
      ...StateHistory.get()
    }
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

  render() {
    const { namespace, name } = this.props
    const { loading, configs, listView } = this.state
    return h(Fragment, [
      div({ style: styles.toolbarContainer }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
          'Tools'
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
        _.map(config => {
          return h(ToolCard, { key: `${config.namespace}/${config.name}`, namespace, name, config, listView })
        }, configs),
        configs && !configs.length && div(['No tools added']),
        loading && spinnerOverlay
      ])
    ])
  }

  componentDidMount() {
    this.refresh()
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(['configs', 'listView'], this.state))
  }
}))

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: WorkspaceTools,
    title: ({ name }) => `${name} - Tools`
  })
}
