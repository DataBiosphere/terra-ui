import _ from 'lodash/fp'
import { b, h } from 'react-hyperscript-helpers'
import { buttonPrimary, spinnerOverlay } from 'src/components/common'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { withWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { ajaxCaller } from 'src/libs/ajax'
import { requiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'
import ErrorView from 'src/components/ErrorView'


export default _.flow(
  ajaxCaller,
  withWorkspaces()
)(class ExportNotebookModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedWorkspaceId: undefined,
      error: undefined,
      exported: false,
      newName: props.printName
    }
  }

  getSelectedWorkspace() {
    const { workspaces } = this.props
    const { selectedWorkspaceId } = this.state
    return _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)
  }

  render() {
    const { exported } = this.state

    return exported ? this.renderPostExport() : this.renderExportForm()
  }

  renderExportForm() {
    const { workspaces, thisWorkspaceId, onDismiss } = this.props
    const { selectedWorkspaceId, exporting, error, newName } = this.state

    const errors = validate(
      { selectedWorkspaceId, newName },
      {
        selectedWorkspaceId: { presence: true },
        newName: {
          presence: { allowEmpty: false }
        }
      },
      { prettify: v => ({ newName: 'Name' }[v] || validate.prettify(v)) }
    )

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      okButton: buttonPrimary({
        tooltip: Utils.summarizeErrors(errors),
        disabled: !!errors,
        onClick: () => this.export()
      }, ['Export'])
    }, [
      requiredFormLabel('Destination'),
      h(WorkspaceSelector, {
        workspaces: _.filter(({ workspace: { workspaceId }, accessLevel }) => {
          return thisWorkspaceId !== workspaceId && Utils.canWrite(accessLevel)
        }, workspaces),
        value: selectedWorkspaceId,
        onChange: v => this.setState({ selectedWorkspaceId: v })
      }),
      requiredFormLabel('Name'),
      validatedInput({
        error: Utils.summarizeErrors(errors && errors.newName),
        inputProps: {
          value: newName,
          onChange: e => this.setState({ newName: e.target.value })
        }
      }),
      exporting && spinnerOverlay,
      error && h(ErrorView, { error, collapses: false })
    ])
  }

  renderPostExport() {
    const { onDismiss } = this.props
    const { newName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      cancelText: 'Stay Here',
      okButton: buttonPrimary({
        onClick: () => Nav.goToPath('workspace-notebooks', {
          namespace: selectedWorkspace.namespace,
          name: selectedWorkspace.name
        })
      }, ['Go to exported tool'])
    }, [
      'Successfully exported ',
      b([newName]),
      ' to ',
      b([selectedWorkspace.name]),
      '. Do you want to view the exported tool?'
    ])
  }

  async export() {
    const { thisWorkspaceNamespace, bucketName, ajax: { Buckets } } = this.props //where we are
    const { newName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace //where we want to go
    console.log({ bucketName, selectedWorkspace })
    try {
      this.setState({ exporting: true })
      await Buckets.notebook(thisWorkspaceNamespace, bucketName, selectedWorkspace.bucketName, newName)['copy'](newName)
      this.setState({ exported: true })
    } catch (error) {
      this.setState({ error: await error.text(), exporting: false })
    }
  }
})
