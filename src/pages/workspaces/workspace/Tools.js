import _ from 'lodash/fp'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
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
/*  shortToolCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  },*/ // possibly not necessary
  shortTitle: {
    flex: 'none',
    color: colors.blue[0], fontSize: 16,
    lineHeight: '20px', height: '40px',
    overflow: 'hidden', overflowWrap: 'break-word'
  },
  /*shortCreateCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    color: colors.blue[0], fontSize: 20, lineHeight: '28px'
  },*/  // To be added later
  longCard: {
    ...Style.elements.card,
    width: '100%', minWidth: 0, height: 80,
    margin: '0.25rem 0.5rem'
  },
/*  longToolCard: {
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  },*/ // possibly not necessary
  longTitle: {
    color: colors.blue[0], fontSize: 16,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  }
}

const ToolCard = pure(({ listView, name, namespace, config }) => {
  const { namespace: workflowNamespace, name: workflowName, methodRepoMethod: { sourceRepo, methodVersion } } = config
  return listView ? a({
    style: styles.shortCard,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName })
  }, [
    div({ style: styles.shortTitle }, [workflowName]),
    div([`V. ${methodVersion}`]),
    div([`Source: ${sourceRepo}`])
  ]) : a({
    style: styles.longCard,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName })
  }, [
    div({ style: styles.longTitle }, [workflowName]),
    div([`V. ${methodVersion}`]),
    div({ style: { flex: 'none', width: 400 } }, [`Source: ${sourceRepo}`])
  ])
})

const WorkspaceTools = ajaxCaller(wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Tools', activeTab: 'tools'
},
class ToolsContent extends Component {
  constructor(props) {
    super(props)
    this.state = { ...StateHistory.get() }
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
    return div({ style: styles.cardContainer }, [
      _.map(config => {
        return h(ToolCard, { key: `${config.namespace}/${config.name}`, namespace, name, config })
      }, configs),
      configs && !configs.length && div(['No tools added']),
      loading && spinnerOverlay
    ])
  }

  componentDidMount() {
    this.refresh()
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(['configs'], this.state))
  }
}))

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: WorkspaceTools,
    title: ({ name }) => `${name} - Tools`
  })
}
