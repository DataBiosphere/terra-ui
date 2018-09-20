import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, link, spinnerOverlay } from 'src/components/common'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'

export default ajaxCaller(class DeleteWorkspaceModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      deleting: false
    }
  }

  async deleteWorkspace() {
    const { workspace: { workspace: { namespace, name } }, ajax: { Workspaces } } = this.props
    try {
      this.setState({ deleting: true })
      await Workspaces.workspace(namespace, name).delete()
      if (Nav.history.location.pathname !== '/workspaces') {
        Nav.goToPath('workspaces')
      } else {
        document.location.reload()
      }
    } catch (error) {
      reportError('Error deleting workspace', error)
      this.setState({ deleting: false })
    }
  }

  render() {
    const { workspace: { workspace: { bucketName } }, onDismiss } = this.props
    const { deleting } = this.state
    return h(Modal, {
      title: 'Confirm delete',
      onDismiss,
      okButton: buttonPrimary({
        onClick: () => this.deleteWorkspace()
      }, 'Delete')
    }, [
      div(['Are you sure you want to permanently delete this workspace?']),
      div({ style: { marginTop: '1rem' } }, [
        'Deleting it will delete the associated ',
        link({
          target: '_blank',
          href: Utils.bucketBrowserUrl(bucketName)
        }, ['Google Cloud Bucket']),
        ' and all its data.'
      ]),
      deleting && spinnerOverlay
    ])
  }
})
