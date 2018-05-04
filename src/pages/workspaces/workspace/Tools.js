import _ from 'lodash'
import { div, h, img } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Rawls } from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


export default class WorkspaceTools extends Component {
  render() {
    const { modal, configs } = this.state

    return div({ style: { margin: '1rem' } }, [
      modal ? h(Modal, {
        onDismiss: () => this.setState({ modal: false }),
        okButton: buttonPrimary({ onClick: () => this.setState({ modal: false }) }, 'Run')
      }, [
        img({ src: '/launchAnalysis.png', width: 759 }) // placeholder
      ]) : null,
      div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
        'Pipelines'),
      div({
          onClick: () => this.setState({ modal: true }),
          style: _.defaults({
            margin: '0.5rem', textDecoration: 'none', cursor: 'pointer',
            backgroundColor: 'white', color: Style.colors.text
          }, Style.elements.card)
        },
        [
          div({ style: Style.elements.cardTitle }, 'Dummy Pipeline'),
          div({ style: { display: 'flex', alignItems: 'flex-end', fontSize: '0.8rem' } },
            [
              div({ style: { flexGrow: 1 } }, 'Magrathea Labs'),
              div({ style: { width: '35%' } }, ['Last changed: Yesterday']),
              div({
                title: 'Tricia Marie McMillan',
                style: {
                  height: '1.5rem', width: '1.5rem', borderRadius: '1.5rem',
                  lineHeight: '1.5rem', textAlign: 'center',
                  backgroundColor: Style.colors.accent, color: 'white'
                }
              }, 'T')
            ])
        ]),
      div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title, marginTop: '3rem' } },
        'Real Configs'),
      configs ?
        div({}, _.map(configs, ({ name }) => div(name))) :
        spinner()
    ])
  }

  componentDidMount() {
    const { workspace: { namespace, name } } = this.props

    Rawls.workspace(namespace, name).methodConfigs().list()
      .then(configs => this.setState({ configs }))
  }
}
