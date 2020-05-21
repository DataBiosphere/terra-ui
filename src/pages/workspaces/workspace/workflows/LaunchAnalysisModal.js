import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { b, div, h, wbr } from 'react-hyperscript-helpers'
import { ButtonPrimary, CromwellVersionLink } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { createEntitySet } from 'src/libs/data-utils'
import * as Utils from 'src/libs/utils'
import {
  chooseRows, chooseSetComponents, chooseSets, processAll, processAllAsSet, processMergedSet
} from 'src/pages/workspaces/workspace/workflows/EntitySelectionType'


export default ajaxCaller(class LaunchAnalysisModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      launching: undefined, message: undefined, launchError: undefined
    }
  }

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

  getEntities() {
    const { entitySelectionModel: { type, selectedEntities }, processSingle, config: { rootEntityType } } = this.props

    if (!processSingle) {
      return Utils.switchCase(type,
        [chooseRows, () => _.keys(selectedEntities)],
        [chooseSets, () => _.keys(selectedEntities)],
        [chooseSetComponents, () => _.keys(selectedEntities)],
        [processMergedSet, () => _.flow(
          _.flatMap(`attributes.${rootEntityType}s.items`),
          _.map('entityName')
        )(selectedEntities)],
        [Utils.DEFAULT, () => selectedEntities]
      )
    }
  }

  render() {
    const { onDismiss, entitySelectionModel: { type }, entityMetadata, config: { rootEntityType }, processSingle } = this.props
    const { launching, message, launchError } = this.state
    const entities = this.getEntities()
    const entityCount = Utils.cond(
      [processSingle, () => 1],
      [type === processAll, () => entityMetadata[rootEntityType].count],
      [type === processAllAsSet, () => 1],
      [type === chooseSetComponents, () => 1],
      [_.isArray(entities), () => _.uniq(entities).length],
      () => _.size(entities)
    )
    const wrappableOnPeriods = _.flow(str => str?.split(/(\.)/), _.flatMap(sub => sub === '.' ? [wbr(), '.'] : sub))

    return h(Modal, {
      title: !launching ? 'Confirm launch' : 'Launching Analysis',
      onDismiss,
      showCancel: !launching,
      okButton: !launchError ?
        h(ButtonPrimary, {
          disabled: launching,
          onClick: () => {
            this.setState({ launching: true })
            this.doLaunch()
          }
        }, ['Launch']) :
        h(ButtonPrimary, { onClick: onDismiss, disabled: !entities }, ['OK'])
    }, [
      div({ style: { margin: '1rem 0' } }, ['This analysis will be run by ', h(CromwellVersionLink), '.']),
      (!entities && !processSingle) ? spinner() : div({ style: { margin: '1rem 0' } }, [
        'This will launch ', b([entityCount]), ` analys${entityCount === 1 ? 'is' : 'es'}`,
        '.',
        !processSingle && type !== processAll && entityCount !== entities.length && div({
          style: { fontStyle: 'italic', marginTop: '0.5rem' }
        }, ['(Duplicate entities are only processed once.)'])
      ]),
      message && div({ style: { display: 'flex' } }, [
        spinner({ style: { marginRight: '0.5rem' } }),
        message
      ]),
      div({ style: { color: colors.danger(), overflowWrap: 'break-word' } }, [
        h(Fragment, wrappableOnPeriods(launchError))
      ])
    ])
  }

  async doLaunch() {
    const { workspaceId: { namespace, name }, processSingle, entitySelectionModel: { type }, config: { rootEntityType }, ajax: { Workspaces } } = this.props
    const entities = this.getEntities()

    this.setState({ message: 'Checking bucket access...' })
    const hasBucketAccess = await this.preFlightBucketAccess()
    if (!hasBucketAccess) {
      this.setState({
        message: undefined,
        launchError: 'Error confirming workspace bucket access. This may be a transient problem. Please try again in a few minutes. If the problem persists, please contact support.'
      })
    } else if (processSingle) {
      this.launch()
    } else if (type === processAll) {
      this.setState({ message: 'Fetching data...' })
      const allEntities = _.map('name', await Workspaces.workspace(namespace, name).entitiesOfType(rootEntityType))
      this.createSetAndLaunch(allEntities)
    } else if (type === chooseRows || type === chooseSets) {
      if (entities.length === 1) {
        this.launch(rootEntityType, entities[0])
      } else {
        this.createSetAndLaunch(entities)
      }
    } else if (type === processMergedSet) {
      this.createSetAndLaunch(entities)
    } else if (type === chooseSetComponents) {
      this.createSetAndLaunchOne(entities)
    } else if (type === processAllAsSet) {
      const baseEntityType = rootEntityType.slice(0, -4)
      const allBaseEntities = _.map('name', await Workspaces.workspace(namespace, name).entitiesOfType(baseEntityType))
      this.createSetAndLaunchOne(allBaseEntities)
    }
  }

  async createSetAndLaunch(entities) {
    const {
      workspaceId,
      entitySelectionModel: { newSetName },
      config: { rootEntityType }
    } = this.props

    try {
      await createEntitySet({ entities, rootEntityType, newSetName, workspaceId })
    } catch (error) {
      this.setState({ launchError: await error.text(), message: undefined })
      return
    }

    await this.launch(`${rootEntityType}_set`, newSetName, `this.${rootEntityType}s`)
  }

  async createSetAndLaunchOne(entities) {
    const {
      workspaceId,
      entitySelectionModel: { newSetName },
      config: { rootEntityType }
    } = this.props

    try {
      await createEntitySet({ entities, rootEntityType: rootEntityType.slice(0, -4), newSetName, workspaceId })
    } catch (error) {
      this.setState({ launchError: await error.text(), message: undefined })
      return
    }

    await this.launch(rootEntityType, newSetName)
  }

  baseLaunch(entityType, entityName, expression) {
    const {
      workspaceId: { namespace, name },
      config: { namespace: configNamespace, name: configName },
      useCallCache, deleteIntermediateOutputFiles
    } = this.props

    return Ajax().Workspaces.workspace(namespace, name).methodConfig(configNamespace, configName).launch({
      entityType, entityName, expression, useCallCache, deleteIntermediateOutputFiles
    })
  }

  async launch(entityType, entityName, expression) {
    const { onSuccess } = this.props

    try {
      this.setState({ message: 'Launching analysis...' })

      const { submissionId } = await this.baseLaunch(entityType, entityName, expression)
      onSuccess(submissionId)
    } catch (error) {
      this.setState({ launchError: await error.text(), message: undefined })
    }
  }
})
