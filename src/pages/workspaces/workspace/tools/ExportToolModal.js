import { b, div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, spinnerOverlay } from 'src/components/common'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import WorkspaceSelector from 'src/components/WorkspaceSelector'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { requiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const ExportToolModal = ajaxCaller(class ExportToolModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedWorkspace: undefined,
      toolName: props.methodConfig.name,
      error: undefined,
      exported: false
    }
  }

  render() {
    const { exported } = this.state

    return exported ? this.renderPostExport() : this.renderExportForm()
  }

  renderExportForm() {
    const { thisWorkspace, onDismiss } = this.props
    const { selectedWorkspace, toolName, exporting, error } = this.state

    const errors = validate({ toolName }, {
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
        disabled: !selectedWorkspace || errors,
        onClick: () => this.export()
      }, ['Export'])
    }, [
      requiredFormLabel('Destination'),
      h(WorkspaceSelector, {
        filter: ({ workspace: { workspaceId }, accessLevel }) => {
          return thisWorkspace.workspaceId !== workspaceId && Utils.canWrite(accessLevel)
        },
        selectedWorkspace,
        onWorkspaceSelected: ws => this.setState({ selectedWorkspace: ws })
      }),
      requiredFormLabel('Name'),
      validatedInput({
        error: Utils.summarizeErrors(errors),
        inputProps: {
          value: toolName,
          onChange: e => this.setState({ toolName: e.target.value })
        }
      }),
      exporting && spinnerOverlay,
      error && div({ style: { marginTop: '0.5rem', color: colors.red[0] } }, [error])
    ])
  }

  renderPostExport() {
    const { onDismiss } = this.props
    const { selectedWorkspace, toolName } = this.state

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
    const { thisWorkspace, methodConfig, ajax: { Workspaces } } = this.props
    const { selectedWorkspace, toolName } = this.state

    try {
      this.setState({ exporting: true })
      await Workspaces
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
      this.setState({ error: (await error.json()).message, exporting: false })
    }
  }
})


export default ExportToolModal
