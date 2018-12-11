import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { Component } from 'src/libs/wrapped-components'


export default ajaxCaller(class LaunchAnalysisModal extends Component {
  render() {
    const { onDismiss } = this.props
    const { message, launchError } = this.state

    return h(Modal, {
      title: 'Launching Analysis',
      onDismiss,
      showCancel: false,
      okButton: !!launchError && buttonPrimary({ onClick: onDismiss }, ['OK'])
    }, [
      message && div([message, spinner()]),
      launchError && div({ style: { color: colors.red[0] } }, [launchError])
    ])
  }

  async componentDidMount() {
    const {
      workspaceId: { namespace, name },
      processSingle, processAllRows, selectedEntities, newSetName,
      config: { namespace: configNamespace, name: configName, rootEntityType },
      onSuccess,
      ajax: { Workspaces }
    } = this.props

    const workspace = Workspaces.workspace(namespace, name)

    let entityType = undefined
    let entityName = undefined

    if (!processSingle) {
      entityType = rootEntityType
      entityName = newSetName

      let entities = []

      if (processAllRows) {
        this.setState({ message: 'Fetching data...' })
        entities = _.map('name', await workspace.entitiesOfType(rootEntityType))
      } else {
        entities = selectedEntities
      }

      this.setState({ message: 'Creating data set...' })
      const newSet = {
        name: newSetName,
        entityType: rootEntityType,
        attributes: {
          [`${rootEntityType}s`]: {
            itemsType: 'EntityReference',
            items: entities
          }
        }
      }

      await workspace.createEntity(newSet)
    }

    try {
      this.setState({ message: 'Launching analysis...' })

      const { submissionId } = await workspace.methodConfig(configNamespace, configName).launch({
        entityType, entityName, useCallCache: true
      })
      onSuccess(submissionId)
    } catch (error) {
      this.setState({ launchError: JSON.parse(await error.text()).message, message: undefined })
    }
  }
})
