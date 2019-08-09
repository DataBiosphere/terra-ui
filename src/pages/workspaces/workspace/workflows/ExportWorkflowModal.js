import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { b, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { withWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { RequiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const ExportWorkflowModal = withWorkspaces(class ExportWorkflowModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedWorkspaceId: props.sameWorkspace ? props.thisWorkspace.workspaceId : undefined,
      workflowName: `${props.methodConfig.name}${props.sameWorkspace ? '_copy' : ''}`,
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
    const { workspaces, thisWorkspace, sameWorkspace, onDismiss } = this.props
    const { selectedWorkspaceId, workflowName, exporting, error } = this.state

    const errors = validate({ selectedWorkspaceId, workflowName }, {
      selectedWorkspaceId: { presence: true },
      workflowName: {
        presence: { allowEmpty: false },
        format: {
          pattern: /^[A-Za-z0-9_\-.]*$/,
          message: 'can only contain letters, numbers, underscores, dashes, and periods'
        }
      }
    })

    return h(Modal, {
      title: sameWorkspace ? 'Duplicate Workflow' : 'Copy to Workspace',
      onDismiss,
      okButton: h(ButtonPrimary, {
        tooltip: Utils.summarizeErrors(errors),
        disabled: !!errors,
        onClick: () => this.export()
      }, ['Copy'])
    }, [
      !sameWorkspace && h(IdContainer, [id => h(Fragment, [
        h(RequiredFormLabel, { htmlFor: id }, ['Destination']),
        h(WorkspaceSelector, {
          id,
          workspaces: _.filter(({ workspace: { workspaceId }, accessLevel }) => {
            return thisWorkspace.workspaceId !== workspaceId && Utils.canWrite(accessLevel)
          }, workspaces),
          value: selectedWorkspaceId,
          onChange: v => this.setState({ selectedWorkspaceId: v })
        })
      ])]),
      h(IdContainer, [id => h(Fragment, [
        h(RequiredFormLabel, { htmlFor: id }, ['Name']),
        h(ValidatedInput, {
          error: Utils.summarizeErrors(errors && errors.workflowName),
          inputProps: {
            id, value: workflowName,
            onChange: v => this.setState({ workflowName: v })
          }
        })
      ])]),
      exporting && spinnerOverlay,
      error && h(ErrorView, { error, collapses: false })
    ])
  }

  renderPostExport() {
    const { onDismiss } = this.props
    const { workflowName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      cancelText: 'Stay Here',
      okButton: h(ButtonPrimary, {
        onClick: () => Nav.goToPath('workflow', {
          namespace: selectedWorkspace.namespace,
          name: selectedWorkspace.name,
          workflowNamespace: selectedWorkspace.namespace,
          workflowName
        })
      }, ['Go to exported workflow'])
    }, [
      'Successfully exported ',
      b([workflowName]),
      ' to ',
      b([selectedWorkspace.name]),
      '. Do you want to view the exported workflow?'
    ])
  }

  async export() {
    const { thisWorkspace, sameWorkspace, methodConfig, onSuccess } = this.props
    const { workflowName } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    try {
      this.setState({ exporting: true })
      await Ajax().Workspaces
        .workspace(thisWorkspace.namespace, thisWorkspace.name)
        .methodConfig(methodConfig.namespace, methodConfig.name)
        .copyTo({
          destConfigNamespace: selectedWorkspace.namespace,
          destConfigName: workflowName,
          workspaceName: {
            namespace: selectedWorkspace.namespace,
            name: selectedWorkspace.name
          }
        })
      if (sameWorkspace) {
        onSuccess()
      } else {
        this.setState({ exported: true })
      }
    } catch (error) {
      this.setState({ error: await error.text(), exporting: false })
    }
  }
})

export default ExportWorkflowModal
