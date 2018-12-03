import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { Component } from 'src/libs/wrapped-components'


export default ajaxCaller(class LaunchAnalysisModal extends Component {
  render() {
    const { onDismiss } = this.props
    const { launchError } = this.state

    return h(Modal, {
      title: 'Launching Analysis',
      onDismiss,
      showCancel: false,
      okButton: !!launchError && buttonPrimary({ onClick: onDismiss }, ['OK'])
    }, [
      launchError ?
        div({ style: { marginTop: 10, color: colors.red[0] } }, [launchError]) :
        centeredSpinner()
    ])
  }

  async componentDidMount() {
    const {
      workspaceId: { namespace, name },
      selectedEntity,
      config: { namespace: configNamespace, name: configName, rootEntityType },
      onSuccess,
      ajax: { Workspaces }
    } = this.props

    this.setState({ launching: true })

    try {
      const { submissionId } = await Workspaces.workspace(namespace, name).methodConfig(configNamespace, configName).launch({
        entityType: rootEntityType,
        entityName: selectedEntity,
        useCallCache: true
      })
      onSuccess(submissionId)
    } catch (error) {
      this.setState({ launchError: JSON.parse(await error.text()).message, launching: false })
    }
  }
})
