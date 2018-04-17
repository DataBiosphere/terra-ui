import { div, hh, span } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/main/components/common'
import Modal from 'src/main/components/Modal'
import * as Style from 'src/main/libs/style'
import { Component } from 'src/main/libs/wrapped-components'


export default hh(class WorkspaceDashboard extends Component {
  render() {
    const { modal } = this.state

    return div({ style: { margin: '1rem' } }, [
        modal ? Modal({
          onDismiss: () => this.setState({ modal: false }),
          title: 'Workspace Info',
          showCancel: false,
          okButton: buttonPrimary({ onClick: () => this.setState({ modal: false }) }, 'Done')
        }, [
          div({ style: { whiteSpace: 'pre', overflow: 'auto', padding: '1rem' } },
            JSON.stringify(this.props, null, 2))
        ]) : null,
        div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
          'ACCESS LEVEL'),
        span({ 'data-test-id': 'access-level' }, this.props.accessLevel),
        buttonPrimary({
          style: { marginTop: '1rem', display: 'block' },
          onClick: () => this.setState({ modal: true })
        }, 'Full Workspace Info')
      ]
    )
  }
})
