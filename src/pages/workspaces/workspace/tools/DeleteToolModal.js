import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { Component } from 'src/libs/wrapped-components'


export default class DeleteToolModal extends Component {
  render() {
    const { onDismiss, methodConfig: { name } } = this.props
    const { error } = this.state

    return h(Modal, {
      title: 'Delete Tool',
      onDismiss,
      okButton: buttonPrimary({
        onClick: () => this.delete()
      }, ['Delete'])
    }, [
      `Are you sure you want to delete "${name}"?`,
      error && div({ style: { marginTop: '0.5rem', color: colors.danger() } }, [error])
    ])
  }

  async delete() {
    const { workspace, methodConfig, onSuccess } = this.props

    try {
      await Ajax().Workspaces
        .workspace(workspace.namespace, workspace.name)
        .methodConfig(methodConfig.namespace, methodConfig.name)
        .delete()
      onSuccess()
    } catch (error) {
      reportError('Error deleting tool', error)
    }
  }
}
