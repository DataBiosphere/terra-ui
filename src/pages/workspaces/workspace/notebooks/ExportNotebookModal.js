import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { b, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import Modal from 'src/components/Modal'
import { notebookNameInput, notebookNameValidator } from 'src/components/notebook-utils'
import { withWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import { RequiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const cutName = name => name.slice(10, -6) // removes 'notebooks/' and the .ipynb suffix

export default _.flow(
  ajaxCaller,
  withWorkspaces
)(class ExportNotebookModal extends Component {
  static propTypes = {
    fromLauncher: PropTypes.bool,
    onDismiss: PropTypes.func.isRequired,
    printName: PropTypes.string.isRequired,
    workspace: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      selectedWorkspaceId: undefined,
      error: undefined,
      copied: false,
      newName: props.printName
    }
  }

  getSelectedWorkspace() {
    const { workspaces } = this.props
    const { selectedWorkspaceId } = this.state
    return _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)
  }

  render() {
    const { copied } = this.state
    return copied ? this.renderPostCopy() : this.renderCopyForm()
  }

  renderCopyForm() {
    const { workspaces, workspace, onDismiss } = this.props
    const { selectedWorkspaceId, copying, error, newName, existingNames } = this.state
    const errors = validate(
      { selectedWorkspaceId, newName },
      {
        selectedWorkspaceId: { presence: true },
        newName: notebookNameValidator(existingNames)
      },
      { prettify: v => ({ newName: 'Name' }[v] || validate.prettify(v)) }
    )
    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      okButton: h(ButtonPrimary, {
        tooltip: Utils.summarizeErrors(errors),
        disabled: !!errors,
        onClick: () => this.copy()
      }, ['Copy'])
    }, [
      h(IdContainer, [id => h(Fragment, [
        h(RequiredFormLabel, { htmlFor: id }, ['Destination']),
        h(WorkspaceSelector, {
          id,
          workspaces: _.filter(Utils.isValidWsExportTarget(workspace), workspaces),
          value: selectedWorkspaceId,
          onChange: v => {
            this.setState({ selectedWorkspaceId: v })
            this.findNotebooks(v)
          }
        })
      ])]),
      h(IdContainer, [id => h(Fragment, [
        h(RequiredFormLabel, { htmlFor: id }, ['Name']),
        notebookNameInput({
          error: Utils.summarizeErrors(errors && errors.newName),
          inputProps: {
            id,
            value: newName,
            onChange: v => this.setState({ newName: v })
          }
        })
      ])]),
      copying && spinnerOverlay,
      error && h(ErrorView, { error, collapses: false })
    ])
  }

  renderPostCopy() {
    const { onDismiss, fromLauncher } = this.props
    const { newName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      cancelText: 'Stay Here',
      okButton: h(ButtonPrimary, {
        onClick: () => {
          if (fromLauncher) {
            Nav.goToPath('workspace-notebook-launch', {
              namespace: selectedWorkspace.namespace,
              name: selectedWorkspace.name,
              notebookName: newName + '.ipynb'
            })
          } else {
            Nav.goToPath('workspace-notebooks', {
              namespace: selectedWorkspace.namespace,
              name: selectedWorkspace.name
            })
          }
        }
      }, ['Go to copied notebook'])
    }, [
      'Successfully copied ',
      b([newName]),
      ' to ',
      b([selectedWorkspace.name]),
      '. Do you want to view the copied notebook?'
    ])
  }

  async findNotebooks(v) {
    const { ajax: { Buckets }, workspaces } = this.props
    const tempChosenWorkspace = _.find({ workspace: { workspaceId: v } }, workspaces).workspace
    const selectedNotebooks = await Buckets.listNotebooks(tempChosenWorkspace.namespace, tempChosenWorkspace.bucketName)
    const existingNames = _.map(({ name }) => cutName(name), selectedNotebooks)
    this.setState({ existingNames })
  }

  async copy() {
    const { printName, workspace } = this.props
    const { newName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace
    try {
      this.setState({ copying: true })
      await Ajax().Buckets.notebook(workspace.workspace.namespace, workspace.workspace.bucketName, printName).copy(newName, selectedWorkspace.bucketName)
      this.setState({ copied: true })
    } catch (error) {
      this.setState({ error: await error.text(), copying: false })
    }
  }
})
