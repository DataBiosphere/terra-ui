import _ from 'lodash/fp'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
import { Workspaces } from 'src/libs/ajax'
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
  card: {
    ...Style.elements.card, width: 300, height: 125, margin: '1rem 0.5rem',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  },
  shortTitle: {
    flex: 'none',
    color: colors.blue[0], fontSize: 16,
    lineHeight: '20px', height: '40px',
    overflow: 'hidden', overflowWrap: 'break-word'
  }
}

const ToolCard = pure(({ name, namespace, config }) => {
  const { namespace: workflowNamespace, name: workflowName, methodRepoMethod: { sourceRepo, methodVersion } } = config
  return a({
    style: styles.card,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName })
  }, [
    div({ style: styles.shortTitle }, [workflowName]),
    div([`V. ${methodVersion}`]),
    div([`Source: ${sourceRepo}`])
  ])
})

const WorkspaceTools = wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Tools', activeTab: 'tools'
},
class ToolsContent extends Component {
  constructor(props) {
    super(props)
    this.state = { ...StateHistory.get() }
  }

  async refresh() {
    const { namespace, name } = this.props

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
    return div({ style: styles.cardContainer }, [
      ..._.map(config => {
        return h(ToolCard, { key: `${config.namespace}/${config.name}`, namespace, name, config })
      }, configs),
      loading && spinnerOverlay
    ])
  }

  componentDidMount() {
    this.refresh()
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(['configs'], this.state))
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: WorkspaceTools,
    title: ({ name }) => `${name} - Tools`
  })
}
