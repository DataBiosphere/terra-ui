import _ from 'lodash'
import { div, h } from 'react-hyperscript-helpers'
import { link } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { DataGrid } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default class WorkspaceTools extends Component {
  constructor(props) {
    super(props)
    this.state = { itemsPerPage: 6, pageNumber: 1 }
  }

  render() {
    const { configs, itemsPerPage } = this.state

    return div({ style: { margin: '1rem 4rem' } }, [
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
            return div({
              style: _.defaults({
                width: '30%', margin: '1rem 1.5rem', textDecoration: 'none',
                color: Style.colors.text
              }, Style.elements.card)
            }, [
              link({
                href: Nav.getLink('workflow', {
                  workspaceNamespace: this.props.workspace.namespace,
                  workspaceName: this.props.workspace.name,
                  workflowNamespace: namespace,
                  workflowName: name
                }),
                style: { display: 'block', marginBottom: '0.5rem', fontSize: 16 }
              }, name),
              div(`V. ${methodVersion}`),
              div(`Source: ${sourceRepo}`),
              link({
                onClick: () => Utils.log('TODO: launch'),
                style: {
                  display: 'flex', alignItems: 'center', marginTop: '0.5rem',
                  fontWeight: 500, fontSize: '80%'
                }
              }, [
                icon('export', { style: { marginRight: '0.25rem' } }), 'LAUNCH ANALYSIS'
              ])
            ])
          }
        }) : spinner()
    ])
  }

  componentDidMount() {
    const { workspace: { namespace, name } } = this.props

    Rawls.workspace(namespace, name).listMethodConfigs()
      .then(configs => this.setState({ configs }))
  }
}
