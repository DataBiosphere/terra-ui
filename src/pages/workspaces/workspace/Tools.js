import _ from 'lodash/fp'
import { a, div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { centeredSpinner } from 'src/components/icons'
import { DataGrid } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


class WorkspaceTools extends Component {
  constructor(props) {
    super(props)
    this.state = { itemsPerPage: 6, pageNumber: 1 }
  }

  refresh() {
    const { namespace, name } = this.props

    this.setState({ configs: undefined })
    Rawls.workspace(namespace, name).listMethodConfigs()
      .then(configs => this.setState({ configs }))
  }

  render() {
    const { configs, itemsPerPage } = this.state
    const workspaceId = _.pick(['namespace', 'name'], this.props)

    return h(WorkspaceContainer,
      {
        ...workspaceId, refresh: () => this.refresh(),
        breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard(workspaceId),
        title: 'Tools', activeTab: 'tools'
      },
      [
        div({ style: { margin: '1rem 4rem' } }, [
          configs ?
            h(DataGrid, {
              dataSource: configs,
              itemsPerPageOptions: [6, 12, 24, 36, 48],
              itemsPerPage,
              onItemsPerPageChanged: itemsPerPage => this.setState({ itemsPerPage }),
              pageNumber: this.state.pageNumber,
              onPageChanged: n => this.setState({ pageNumber: n }),
              renderCard: config => {
                const { name, namespace, methodRepoMethod: { sourceRepo, methodVersion } } = config
                return a({
                  style: {
                    ...Style.elements.card,
                    width: '30%', margin: '1rem 1.5rem', textDecoration: 'none',
                    color: Style.colors.text
                  },
                  href: Nav.getLink('workflow', {
                    workspaceNamespace: workspaceId.namespace,
                    workspaceName: workspaceId.name,
                    workflowNamespace: namespace,
                    workflowName: name
                  })
                }, [
                  div({ style: { ...Style.elements.cardTitle, marginBottom: '0.5rem' } }, name),
                  div(`V. ${methodVersion}`),
                  div(`Source: ${sourceRepo}`)
                ])
              }
            }) : centeredSpinner()
        ])
      ]
    )
  }

  componentDidMount() {
    this.refresh()
  }
}

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: WorkspaceTools
  })
}
