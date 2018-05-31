import _ from 'lodash/fp'
import { a, div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { DataGrid } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


class WorkspaceTools extends Component {
  constructor(props) {
    super(props)
    this.state = _.merge({ itemsPerPage: 6, pageNumber: 1 }, StateHistory.get())
  }

  refresh() {
    const { namespace, name } = this.props

    Rawls.workspace(namespace, name).listMethodConfigs().then(
      configs => this.setState({ isFreshData: true, configs }),
      error => reportError(`Error loading configs: ${error}`)
    )
  }

  render() {
    const { isFreshData, configs, itemsPerPage, pageNumber } = this.state
    const workspaceId = _.pick(['namespace', 'name'], this.props)

    return h(WorkspaceContainer,
      {
        ...workspaceId, refresh: () => {
          this.setState({ isFreshData: false })
          this.refresh()
        },
        breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard(workspaceId),
        title: 'Tools', activeTab: 'tools'
      },
      [
        div({ style: { padding: '1rem 4rem', flexGrow: 1, position: 'relative' } }, [
          configs ?
            h(DataGrid, {
              dataSource: configs,
              itemsPerPageOptions: [6, 12, 24, 36, 48],
              itemsPerPage,
              onItemsPerPageChanged: itemsPerPage => this.setState({ itemsPerPage }),
              pageNumber,
              onPageChanged: n => this.setState({ pageNumber: n }),
              renderCard: config => {
                const { name, namespace, methodRepoMethod: { sourceRepo, methodVersion } } = config
                return a({
                  style: {
                    ...Style.elements.card,
                    width: '30%', margin: '1rem auto', textDecoration: 'none',
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
            }) : centeredSpinner(),
          !isFreshData && configs && spinnerOverlay
        ])
      ]
    )
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
}

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: WorkspaceTools
  })
}
