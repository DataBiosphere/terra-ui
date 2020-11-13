import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { b, div, h, wbr } from 'react-hyperscript-helpers'
import { ButtonPrimary, CromwellVersionLink } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { launch } from 'src/libs/analysis'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import {
  chooseRows, chooseSetComponents, chooseSets, processAll, processAllAsSet, processMergedSet
} from 'src/pages/workspaces/workspace/workflows/EntitySelectionType'


export default Utils.withCancellationSignal(class LaunchAnalysisModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      launching: undefined, message: undefined, launchError: undefined
    }
  }

  render() {
    const { onDismiss, entitySelectionModel: { type, selectedEntities }, entityMetadata, config: { rootEntityType }, processSingle } = this.props
    const { launching, message, launchError } = this.state
    const mergeSets = _.flatMap(`attributes.${rootEntityType}s.items`)
    const entityCount = Utils.cond(
      [processSingle, () => 1],
      [type === chooseRows || type === chooseSets, () => _.size(selectedEntities)],
      [type === processAll, () => entityMetadata[rootEntityType].count],
      [type === processAllAsSet, () => 1],
      [type === chooseSetComponents, () => 1],
      [type === processMergedSet, () => _.flow(mergeSets, _.uniqBy('entityName'))(selectedEntities).length]
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
        h(ButtonPrimary, { onClick: onDismiss }, ['OK'])
    }, [
      div({ style: { margin: '1rem 0' } }, ['This analysis will be run by ', h(CromwellVersionLink), '.']),
      div({ style: { margin: '1rem 0' } }, [
        'This will launch ', b([entityCount]), ` analys${entityCount === 1 ? 'is' : 'es'}`,
        '.',
        type === processMergedSet && entityCount !== mergeSets(selectedEntities).length && div({
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
    try {
      const { workspace, workspace: { workspace: { namespace, name } }, processSingle, entitySelectionModel: { type, selectedEntities, newSetName }, config, config: { rootEntityType }, useCallCache, deleteIntermediateOutputFiles, onSuccess, signal } = this.props

      const baseEntityType = rootEntityType && rootEntityType.slice(0, -4)
      const { selectedEntityType, selectedEntityNames } = await Utils.cond(
        [processSingle, () => ({})],
        [type === processAll, async () => {
          this.setState({ message: 'Fetching data...' })
          const selectedEntityNames = _.map('name', await Ajax(signal).Workspaces.workspace(namespace, name).entitiesOfType(rootEntityType))
          return { selectedEntityType: rootEntityType, selectedEntityNames }
        }],
        [type === chooseRows || type === chooseSets, () => ({ selectedEntityType: rootEntityType, selectedEntityNames: _.keys(selectedEntities) })],
        [type === processMergedSet, () => {
          return _.size(selectedEntities) === 1 ?
            { selectedEntityType: `${rootEntityType}_set`, selectedEntityNames: _.keys(selectedEntities) } :
            { selectedEntityType: rootEntityType, selectedEntityNames: _.flow(_.flatMap(`attributes.${rootEntityType}s.items`), _.map('entityName'))(selectedEntities) }
        }],
        [type === chooseSetComponents, () => ({ selectedEntityType: baseEntityType, selectedEntityNames: _.keys(selectedEntities) })],
        [type === processAllAsSet, async () => {
          this.setState({ message: 'Fetching data...' })
          const selectedEntityNames = _.map('name', await Ajax(signal).Workspaces.workspace(namespace, name).entitiesOfType(baseEntityType))
          return { selectedEntityType: baseEntityType, selectedEntityNames }
        }]
      )
      const { submissionId } = await launch({
        workspace, config, selectedEntityType, selectedEntityNames, newSetName, useCallCache, deleteIntermediateOutputFiles,
        onProgress: stage => {
          this.setState({ message: { createSet: 'Creating set...', launch: 'Launching analysis...', checkBucketAccess: 'Checking bucket access...' }[stage] })
        }
      })
      onSuccess(submissionId)
    } catch (error) {
      this.setState({ launchError: await (error instanceof Response ? error.text() : error.message), message: undefined })
    }
  }
})
