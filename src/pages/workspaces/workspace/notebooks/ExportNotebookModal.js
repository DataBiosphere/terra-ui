import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { buttonPrimary, spinnerOverlay } from 'src/components/common'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { withWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { ajaxCaller } from 'src/libs/ajax'
import { requiredFormLabel } from 'src/libs/forms'
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
    return this.renderExportForm()
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
        disabled: !!errors
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

  async export() {
    const { thisWorkspace, methodConfig, ajax: { Workspaces } } = this.props
    const { notebookName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    try {
      this.setState({ exporting: true })
      await Workspaces
        .workspace(thisWorkspace.namespace, thisWorkspace.name)
        .methodConfig(methodConfig.namespace, methodConfig.name)
        .copyTo({
          destConfigNamespace: selectedWorkspace.namespace,
          destConfigName: notebookName,
          workspaceName: {
            namespace: selectedWorkspace.namespace,
            name: selectedWorkspace.name
          }
        })
      this.setState({ exported: true })
    } catch (error) {
      this.setState({ error: await error.text(), exporting: false })
    }
  }
})
