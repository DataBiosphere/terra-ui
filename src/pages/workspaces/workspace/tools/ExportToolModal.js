import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { textInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import WorkspaceSelector from 'src/components/WorkspaceSelector'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { requiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const ExportToolModal = ajaxCaller(class ExportToolModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedWorkspace: undefined,
      selectedName: props.methodConfig.name,
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
    const { selectedWorkspace, selectedName, error } = this.state

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      okButton: buttonPrimary({
        disabled: !selectedWorkspace || !selectedName,
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
      textInput({
        value: selectedName,
        onChange: e => this.setState({ selectedName: e.target.value })
      }),
      error && div({ style: { marginTop: '0.5rem', color: colors.red[0] } }, [error])
    ])
  }

  renderPostExport() {
    const { onDismiss } = this.props
    const { selectedWorkspace, selectedName } = this.state

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      okButton: buttonPrimary({
        onClick: () => Nav.goToPath('workflow', {
          namespace: selectedWorkspace.namespace,
          name: selectedWorkspace.name,
          workflowNamespace: selectedWorkspace.namespace,
          workflowName: selectedName
        })
      }, ['Go to exported tool'])
    }, [
      `Successfully exported ${selectedName} to ${selectedWorkspace.name}. Do you want to view the exported tool?`
    ])
  }

  async export() {
    const { thisWorkspace, methodConfig, ajax: { Workspaces } } = this.props
    const { selectedWorkspace, selectedName } = this.state

    try {
      await Workspaces
        .workspace(thisWorkspace.namespace, thisWorkspace.name)
        .methodConfig(methodConfig.namespace, methodConfig.name)
        .copyTo({
          destConfigNamespace: selectedWorkspace.namespace,
          destConfigName: selectedName,
          workspaceName: {
            namespace: selectedWorkspace.namespace,
            name: selectedWorkspace.name
          }
        })
      this.setState({ exported: true })
    } catch (error) {
      this.setState({ error: (await error.json()).message })
    }
  }
})


export default ExportToolModal
