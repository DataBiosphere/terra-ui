import { div, hh } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import * as Ajax from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import * as Utils from 'src/libs/utils'


export default hh(class WorkspaceDashboard extends Component {
  componentWillMount() {
    const { namespace, name } = this.props
    Ajax.workspace.details(namespace, name,
      workspace => this.setState({ workspace }),
      failure => this.setState({ failure }))
  }

  render() {
    const { workspace, failure, modal } = this.state

    return Utils.cond(
      [failure, () => `Couldn't load workspace details: ${failure}`],
      [!workspace, () => spinner({ style: { marginTop: '1rem' } })],
      () => div({ style: { margin: '1rem' } }, [
        modal ? Modal({
          onDismiss: () => this.setState({ modal: false }),
          title: 'Workspace Info',
          showCancel: false,
          okButton: buttonPrimary({ onClick: () => this.setState({ modal: false }) }, 'Done')
        }, [
          div({ style: { whiteSpace: 'pre', overflow: 'auto', padding: '1rem' } },
            JSON.stringify(workspace, null, 2))
        ]) : null,
        div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
          'ACCESS LEVEL'),
        workspace['accessLevel'],
        buttonPrimary({
          style: { marginTop: '1rem', display: 'block' },
          onClick: () => this.setState({ modal: true })
        }, 'Full Workspace Info')
      ])
    )
  }
})
