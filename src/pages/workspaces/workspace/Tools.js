import _ from 'lodash/fp'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { PageFadeBox, spinnerOverlay, viewToggleButtons } from 'src/components/common'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Globals from 'src/libs/globals'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  cardContainer: listView => ({
    display: 'flex', flexWrap: 'wrap',
    marginRight: listView ? undefined : '-1rem'
  }),
  shortCard: {
    ...Style.elements.card, width: 300, height: 125, margin: '0 1rem 2rem 0',
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
  longMethodVersion: {
    marginRight: '1rem', width: 90,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  longCard: {
    ...Style.elements.card,
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

const ToolCard = pure(({ listView, name, namespace, config }) => {
  const { namespace: workflowNamespace, name: workflowName, methodRepoMethod: { sourceRepo, methodVersion } } = config
  return listView ? a({
    style: styles.longCard,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName })
  }, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      div({ style: styles.longTitle }, [workflowName]),
      div({ style: styles.longMethodVersion }, [`V. ${methodVersion}`]),
      div({ style: { flex: 'none', width: 130 } }, [`Source: ${sourceRepo}`])
    ])
  ]) : a({
    style: styles.shortCard,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName })
  }, [
    div({ style: styles.shortTitle }, [workflowName]),
    div([`V. ${methodVersion}`]),
    div([`Source: ${sourceRepo}`])
  ])
})

export const WorkspaceTools = ajaxCaller(Globals.usesGlobals(wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Tools', activeTab: 'tools'
},
class ToolsContent extends Component {
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

  render() {
    const { namespace, name } = this.props
    const { loading, configs } = this.state
    const listView = Globals.get('toolsListView')
    return h(PageFadeBox, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Tools']),
        viewToggleButtons(listView, Globals.set('toolsListView'))
      ]),
      div({ style: styles.cardContainer(listView) }, [
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
    StateHistory.update(_.pick(['configs'], this.state))
  }
})))

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: WorkspaceTools,
    title: ({ name }) => `${name} - Tools`
  })
}
