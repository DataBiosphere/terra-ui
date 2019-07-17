import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { Component } from 'src/libs/wrapped-components'
import EntitySelectionType from 'src/pages/workspaces/workspace/workflows/EntitySelectionType'


export default ajaxCaller(class LaunchAnalysisModal extends Component {
  /**
   * Verify that the user's pet service account (used while running workflows) will be able to
   * access the workspace bucket
   *
   * @returns {Promise<boolean>}
   */
  async preFlightBucketAccess() {
    const { workspaceId: { namespace, name }, accessLevel, bucketName, ajax: { Workspaces } } = this.props

    try {
      await Workspaces.workspace(namespace, name).checkBucketAccess(bucketName, accessLevel)
      return true
    } catch (error) {
      // Could check error.requesterPaysError here but for this purpose it really doesn't matter what the error was.
      return false
    }
  }

  async componentDidMount() {
    this.setState({ checkingBucketAccess: true, message: 'Checking bucket access...' })
    const hasBucketAccess = await this.preFlightBucketAccess()
    this.setState({
      checkingBucketAccess: false, message: undefined,
      hasBucketAccess, bucketCheckFailed: !hasBucketAccess
    })
  }

  render() {
    const { onDismiss } = this.props
    const { hasBucketAccess, bucketCheckFailed, launching, message, launchError } = this.state

    return h(Modal, {
      title: !launching ? 'Run Analysis' : 'Launching Analysis',
      onDismiss,
      showCancel: !launching,
      okButton: !launchError ?
        buttonPrimary({
          disabled: !hasBucketAccess || launching,
          onClick: () => {
            this.setState({ launching: true })
            this.doLaunch()
          }
        }, ['Launch']) :
        buttonPrimary({ onClick: onDismiss }, ['OK'])
    }, [
      !message && !bucketCheckFailed && !launchError && div('Confirm launch'),
      message && div([spinner({ style: { marginRight: '0.5rem' } }), message]),
      bucketCheckFailed && div({ style: { color: colors.danger() } }, [
        'Error confirming workspace bucket access. This may be a transient problem. Please try again in a few minutes. If the problem persists, please contact support.'
      ]),
      launchError && div({ style: { color: colors.danger() } }, [launchError])
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
