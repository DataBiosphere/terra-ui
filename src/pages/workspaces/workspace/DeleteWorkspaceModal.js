import { Component } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, link, spinnerOverlay } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


export default class DeleteWorkspaceModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      deleting: false
    }
  }

  async deleteWorkspace() {
    const { workspace: { workspace: { namespace, name } }, onDismiss, onSuccess } = this.props
    try {
      this.setState({ deleting: true })
      await Ajax().Workspaces.workspace(namespace, name).delete()
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
      title: 'Delete workspace',
      onDismiss,
      okButton: buttonPrimary({
        onClick: () => this.deleteWorkspace()
      }, 'Delete workspace')
    }, [
      div(['Are you sure you want to permanently delete ',
        span({ style: { fontWeight: 600 } }, name),
        '?']),
      div({ style: { marginTop: '1rem' } }, [
        'Deleting it will delete the associated ',
        link({
          ...Utils.newTabLinkProps,
          href: bucketBrowserUrl(bucketName)
        }, ['Google Cloud Bucket']),
        ' and all its data.'
      ]), div({
        style: {
          fontWeight: 500,
          marginTop: '1rem'
        }
      }, 'This cannot be undone.'),
      deleting && spinnerOverlay
    ])
  }
}
