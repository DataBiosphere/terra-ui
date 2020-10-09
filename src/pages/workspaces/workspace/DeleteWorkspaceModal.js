import { Component } from 'react'
import { div, h, label, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import * as _ from 'lodash/fp'


export default class DeleteWorkspaceModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      deleting: false,
      deleteConfirmation: ''
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
    const { deleteConfirmation, deleting } = this.state
    return h(Modal, {
      title: 'Delete workspace',
      onDismiss,
      okButton: h(ButtonPrimary, {
        disabled: _.toLower(deleteConfirmation) !== 'i understand',
        onClick: () => this.deleteWorkspace()
      }, 'Delete workspace')
    }, [
      div(['Are you sure you want to permanently delete the workspace ',
        span({ style: { fontWeight: 600, wordBreak: 'break-word' } }, name),
        '?']),
      div({ style: { marginTop: '1rem' } }, [
        'Deleting it will delete the associated ',
        h(Link, {
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
      div({ style: { marginTop: '1rem' } }, [
        label({ htmlFor: 'understand' }, ['Please type \'I Understand\' to continue:']),
        h(TextInput, {
          id: 'understand',
          placeholder: 'I Understand',
          value: deleteConfirmation,
          onChange: v => this.setState({ deleteConfirmation: v })
        }),
      ]),
      deleting && spinnerOverlay
    ])
  }
}
