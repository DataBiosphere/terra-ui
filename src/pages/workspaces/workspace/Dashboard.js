import { div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import Modal from 'src/components/Modal'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


export default class WorkspaceDashboard extends Component {
  render() {
    const { modal } = this.state

    return div({ style: { margin: '1rem' } }, [
      modal && h(Modal, {
        onDismiss: () => this.setState({ modal: false }),
        title: 'Workspace Info',
        showCancel: false,
        okButton: 'Done',
        width: 600
      }, [
        div({ style: { whiteSpace: 'pre', overflow: 'auto', padding: '1rem' } },
          JSON.stringify(this.props, null, 2))
      ]),
      div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
        'ACCESS LEVEL'),
      span({ 'data-test-id': 'access-level' }, this.props.accessLevel),
      buttonPrimary({
        style: { marginTop: '1rem', display: 'block' },
        onClick: () => this.setState({ modal: true })
      }, 'Full Workspace Info')
    ])
  }
}
