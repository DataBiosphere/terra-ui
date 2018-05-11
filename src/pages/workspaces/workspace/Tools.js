import _ from 'lodash'
import { div, h, img } from 'react-hyperscript-helpers'
import { buttonPrimary, link } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
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
    const { modal, configs } = this.state

    return div({ style: { margin: '1rem 4rem' } }, [

      modal && h(Modal, {
        onDismiss: () => this.setState({ modal: false }),
        okButton: buttonPrimary({ onClick: () => this.setState({ modal: false }) }, 'Run'),
        width: 800
      }, [
        img({ src: '/launchAnalysis.png', width: 759 }) // placeholder
      ]),

      configs ?
        h(DataGrid, {
          dataSource: configs,
          itemsPerPageOptions: [6, 12, 24, 36, 48],
          itemsPerPage: this.state.itemsPerPage,
          onItemsPerPageChanged: n => this.setState({ itemsPerPage: n }),
          pageNumber: this.state.pageNumber,
          onPageChanged: n => this.setState({ pageNumber: n }),
          renderCard: config => {
            const { name, methodRepoMethod: { sourceRepo, methodVersion } } = config
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

    Rawls.workspace(namespace, name).methodConfigs.list()
      .then(configs => this.setState({ configs }))
  }
}
