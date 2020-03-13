import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'


const isSet = entityType => _.endsWith('_set', entityType)

/**
 * Conditions this needs to handle:
 *
 * Method config "rootEntityType": sample (or other singular type)
 *   input:
 *     1 entity - create submission with a single job
 *       entityType: "sample"
 *       entityName: entity name
 *       expression: ""
 *     set - create submission with set with expression
 *       entityType: "sample_set"
 *       entityName: sample set name
 *       expression: "samples"
 *     many entities - create set, then create submission with set with expression
 *       entityType: "sample_set"
 *       entityName: sample set name
 *       expression: "samples"
 * Method config: sample_set (or other set type)
 *   input:
 *     set - create submission with set
 *       entityType: "sample_set"
 *       entityName: sample set name
 *       expression: ""
 */
export const launch = async ({
  workspaceNamespace, workspaceName,
  config: { namespace: configNamespace, name: configName, rootEntityType },
  entityType, entityNames, newSetName, expression, useCallCache = true, deleteIntermediateOutputFiles,
  onCreateSet, onLaunch, onSuccess, onFailure
}) => {
  const workspace = Ajax().Workspaces.workspace(workspaceNamespace, workspaceName)
  const methodConfig = workspace.methodConfig(configNamespace, configName)

  const launchParams = await resolveLaunchParams({ entityNames, entityType, onCreateSet, newSetName, rootEntityType, workspace })
  if (!!launchParams) {
    try {
      !!onLaunch && onLaunch()
      const { submissionId } = await methodConfig.launch({ ...launchParams, useCallCache, deleteIntermediateOutputFiles })
      onSuccess(submissionId)
    } catch (error) {
      onFailure(error)
    }
  }
}

const resolveLaunchParams = async ({ entityNames, entityType, onCreateSet, newSetName, rootEntityType, workspace }) => {
  const entityName = _.head(entityNames)

  if (_.isEmpty(entityNames)) {
    reportError('No entities selected')
  } else if (isSet(rootEntityType)) {
    if (_.size(entityNames) > 1) {
      reportError('Cannot create a submission for multiple entity sets')
    } else if (entityType !== rootEntityType) {
      reportError(`Cannot use ${entityType} with method config that needs ${rootEntityType}`)
    } else {
      return { entityType: rootEntityType, entityName }
    }
  } else if (isSet(entityType)) {
    return { entityType, entityName, expression: `this.${rootEntityType}s` }
  } else if (_.size(entityNames) === 1) {
    return { entityType, entityName }
  } else {
    const setType = `${entityType}_set`
    const set = {
      name: newSetName,
      entityType: setType,
      attributes: {
        [`${rootEntityType}s`]: {
          itemsType: 'EntityReference',
          items: _.map(entityName => ({ entityName, entityType: rootEntityType }), entityNames)
        }
      }
    }
    try {
      !!onCreateSet && onCreateSet()
      await workspace.createEntity(set)
    } catch (error) {
      reportError('Error creating entity set', error)
      return
    }
    return { entityType: setType, entityName: newSetName, expression: `this.${rootEntityType}s` }
  }
}
