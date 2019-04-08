import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { Component } from 'src/libs/wrapped-components'
import EntitySelectionType from 'src/pages/workspaces/workspace/tools/EntitySelectionType'


export default ajaxCaller(class LaunchAnalysisModal extends Component {
  render() {
    const { onDismiss } = this.props
    const { launching, message, launchError } = this.state

    return h(Modal, {
      title: !launching ? 'Run Analysis' : 'Launching Analysis',
      onDismiss,
      showCancel: !launching,
      okButton: !launchError ?
        buttonPrimary({
          onClick: () => {
            this.setState({ launching: true })
            this.doLaunch()
          }
        }, ['Launch']) :
        buttonPrimary({ onClick: onDismiss }, ['OK'])
    }, [
      !launching && div('Confirm launch'),
      message && div([spinner({ style: { marginRight: '0.5rem' } }), message]),
      launchError && div({ style: { color: colors.red[0] } }, [launchError])
    ])
  }

  async doLaunch() {
    const {
      workspaceId: { namespace, name },
      processSingle, entitySelectionModel: { type, selectedEntities },
      config: { rootEntityType },
      ajax: { Workspaces }
    } = this.props

    if (processSingle) {
      this.launch()
    } else if (type === EntitySelectionType.processAll) {
      this.setState({ message: 'Fetching data...' })
      const entities = _.map('name', await Workspaces.workspace(namespace, name).entitiesOfType(rootEntityType))
      this.createSetAndLaunch(entities)
    } else if (type === EntitySelectionType.chooseRows) {
      const entities = _.keys(selectedEntities)
      if (_.size(entities) === 1) {
        this.launch(rootEntityType, _.head(entities))
      } else {
        this.createSetAndLaunch(entities)
      }
    } else if (type === EntitySelectionType.processFromSet) {
      const { entityType, name } = selectedEntities
      this.launch(entityType, name, `this.${rootEntityType}s`)
    } else if (type === EntitySelectionType.chooseSet) {
      this.launch(rootEntityType, selectedEntities['name'])
    }
  }

  async createSetAndLaunch(entities) {
    const {
      workspaceId: { namespace, name },
      entitySelectionModel: { newSetName },
      config: { rootEntityType },
      ajax: { Workspaces }
    } = this.props

    const setType = `${rootEntityType}_set`

    this.setState({ message: 'Creating data set...' })
    const newSet = {
      name: newSetName,
      entityType: setType,
      attributes: {
        [`${rootEntityType}s`]: {
          itemsType: 'EntityReference',
          items: _.map(entityName => ({ entityName, entityType: rootEntityType }), entities)
        }
      }
    }

    try {
      await Workspaces.workspace(namespace, name).createEntity(newSet)
    } catch (error) {
      this.setState({ launchError: await error.text(), message: undefined })
      return
    }

    await this.launch(setType, newSetName, `this.${rootEntityType}s`)
  }

  async launch(entityType, entityName, expression) {
    const {
      workspaceId: { namespace, name },
      config: { namespace: configNamespace, name: configName },
      onSuccess, useCallCache,
      ajax: { Workspaces }
    } = this.props

    try {
      this.setState({ message: 'Launching analysis...' })

      const { submissionId } = await Workspaces.workspace(namespace, name).methodConfig(configNamespace, configName).launch({
        entityType, entityName, expression, useCallCache
      })
      onSuccess(submissionId)
    } catch (error) {
      this.setState({ launchError: JSON.parse(await error.text()).message, message: undefined })
    }
  }
})
