import { div, hh } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import Modal from 'src/components/Modal'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


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
          div({ style: { whiteSpace: 'pre', padding: '1rem' } },
            JSON.stringify(this.props, null, 2))
        ]) : null,
        div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
          'ACCESS LEVEL'),
        this.props.accessLevel,
        buttonPrimary({
          style: { marginTop: '1rem', display: 'block' },
          onClick: () => this.setState({ modal: true })
        }, 'Full Workspace Info')
      ]
    )
  }
})
