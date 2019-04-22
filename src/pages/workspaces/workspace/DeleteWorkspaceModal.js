import { Component } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, link, spinnerOverlay } from 'src/components/common'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { reportError } from 'src/libs/error'


export default ajaxCaller(class DeleteWorkspaceModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      deleting: false
    }
  }

  async deleteWorkspace() {
    const { workspace: { workspace: { namespace, name } }, ajax: { Workspaces }, onDismiss, onSuccess } = this.props
    try {
      this.setState({ deleting: true })
      await Workspaces.workspace(namespace, name).delete()
      onDismiss()
      onSuccess()
    } catch (error) {
      reportError('Error deleting workspace', error)
      this.setState({ deleting: false })
    }
  }

  render() {
    const { workspace: { workspace: { bucketName, name } }, onDismiss } = this.props
    const { deleting } = this.state
    return h(Modal, {
      title: 'Confirm delete',
      onDismiss,
      okButton: buttonPrimary({
        onClick: () => this.deleteWorkspace()
      }, 'Delete')
    }, [
      div(['Are you sure you want to permanently delete this workspace, ',
        span({ style: { fontWeight: 600 } }, name),
        '?']),
      div({ style: { marginTop: '1rem' } }, [
        'Deleting it will delete the associated ',
        link({
          target: '_blank',
          href: bucketBrowserUrl(bucketName)
        }, ['Google Cloud Bucket']),
        ' and all its data.'
      ]),
      deleting && spinnerOverlay
    ])
  }
})
