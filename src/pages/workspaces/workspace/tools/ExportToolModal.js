import _ from 'lodash/fp'
import { b, h } from 'react-hyperscript-helpers'
import { buttonPrimary, spinnerOverlay } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { withWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { RequiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const ExportToolModal = withWorkspaces()(class ExportToolModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedWorkspaceId: undefined,
      toolName: props.methodConfig.name,
      error: undefined,
      exported: false
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
    const { workspaces, thisWorkspace, onDismiss } = this.props
    const { selectedWorkspaceId, toolName, exporting, error } = this.state

    const errors = validate({ selectedWorkspaceId, toolName }, {
      selectedWorkspaceId: { presence: true },
      toolName: {
        presence: { allowEmpty: false },
        format: {
          pattern: /^[A-Za-z0-9_\-.]*$/,
          message: 'can only contain letters, numbers, underscores, dashes, and periods'
        }
      }
    })

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      okButton: buttonPrimary({
        tooltip: Utils.summarizeErrors(errors),
        disabled: !!errors,
        onClick: () => this.export()
      }, ['Copy'])
    }, [
      h(RequiredFormLabel, ['Destination']),
      h(WorkspaceSelector, {
        workspaces: _.filter(({ workspace: { workspaceId }, accessLevel }) => {
          return thisWorkspace.workspaceId !== workspaceId && Utils.canWrite(accessLevel)
        }, workspaces),
        value: selectedWorkspaceId,
        onChange: v => this.setState({ selectedWorkspaceId: v })
      }),
      h(RequiredFormLabel, ['Name']),
      h(ValidatedInput, {
        error: Utils.summarizeErrors(errors && errors.toolName),
        inputProps: {
          value: toolName,
          onChange: v => this.setState({ toolName: v })
        }
      }),
      exporting && spinnerOverlay,
      error && h(ErrorView, { error, collapses: false })
    ])
  }

  renderPostExport() {
    const { onDismiss } = this.props
    const { toolName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      cancelText: 'Stay Here',
      okButton: buttonPrimary({
        onClick: () => Nav.goToPath('workflow', {
          namespace: selectedWorkspace.namespace,
          name: selectedWorkspace.name,
          workflowNamespace: selectedWorkspace.namespace,
          workflowName: toolName
        })
      }, ['Go to exported tool'])
    }, [
      'Successfully exported ',
      b([toolName]),
      ' to ',
      b([selectedWorkspace.name]),
      '. Do you want to view the exported tool?'
    ])
  }

  async export() {
    const { thisWorkspace, methodConfig } = this.props
    const { toolName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    try {
      this.setState({ exporting: true })
      await Ajax().Workspaces
        .workspace(thisWorkspace.namespace, thisWorkspace.name)
        .methodConfig(methodConfig.namespace, methodConfig.name)
        .copyTo({
          destConfigNamespace: selectedWorkspace.namespace,
          destConfigName: toolName,
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

export default ExportToolModal
