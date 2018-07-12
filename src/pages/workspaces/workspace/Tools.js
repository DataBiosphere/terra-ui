import _ from 'lodash/fp'
import { a, div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
import { DataGrid } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const WorkspaceTools = wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Tools', activeTab: 'tools'
},
class ToolsContent extends Component {
  constructor(props) {
    super(props)
    this.state = { itemsPerPage: 6, pageNumber: 1, ...StateHistory.get() }
  }

  async refresh() {
    const { namespace, name } = this.props

    try {
      const configs = await Rawls.workspace(namespace, name).listMethodConfigs()
      this.setState({ isFreshData: true, configs })
    } catch (error) {
      reportError('Error loading configs', error)
    }
  }

  render() {
    const { isFreshData, configs, itemsPerPage, pageNumber } = this.state
    const workspaceId = _.pick(['namespace', 'name'], this.props)

    return div({ style: { padding: '1rem 4rem', flexGrow: 1, position: 'relative' } }, [
      configs && h(DataGrid, {
        dataSource: configs,
        itemsPerPageOptions: [6, 12, 24, 36, 48],
        itemsPerPage,
        onItemsPerPageChanged: itemsPerPage => this.setState({ itemsPerPage, pageNumber: 1 }),
        pageNumber,
        onPageChanged: n => this.setState({ pageNumber: n }),
        renderCard: config => {
          const { name, namespace, methodRepoMethod: { sourceRepo, methodVersion } } = config
          return a({
            style: { ...Style.elements.card, width: '30%', margin: '1rem auto' },
            href: Nav.getLink('workflow', {
              namespace: workspaceId.namespace,
              name: workspaceId.name,
              workflowNamespace: namespace,
              workflowName: name
            })
          }, [
            div({ style: { ...Style.elements.cardTitle, marginBottom: '0.5rem' } }, name),
            div(`V. ${methodVersion}`),
            div(`Source: ${sourceRepo}`)
          ])
        }
      }),
      !isFreshData && spinnerOverlay
    ])
  }

  componentDidMount() {
    this.refresh()
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['configs', 'itemsPerPage', 'pageNumber'],
      this.state)
    )
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: WorkspaceTools,
    title: ({ name }) => `${name} - Tools`
  })
}
