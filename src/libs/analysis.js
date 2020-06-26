import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'


export const launch = async ({
  workspace: { workspace: { namespace, name, bucketName }, accessLevel },
  config: { namespace: configNamespace, name: configName, rootEntityType },
  entityType, entityNames, newSetName, useCallCache = true, deleteIntermediateOutputFiles,
  onProgress
}) => {
  const createSet = () => {
    onProgress('createSet')
    return Ajax().Workspaces.workspace(namespace, name).createEntity({
      name: newSetName,
      entityType: `${entityType}_set`,
      attributes: {
        [`${entityType}s`]: {
          itemsType: 'EntityReference',
          items: _.map(entityName => ({ entityName, entityType }), entityNames)
        }
      }
    })
  }
  onProgress('checkBucketAccess')
  try {
    await Ajax().Workspaces.workspace(namespace, name).checkBucketAccess(bucketName, accessLevel)
  } catch (error) {
    throw new Error('Error confirming workspace bucket access. This may be a transient problem. Please try again in a few minutes. If the problem persists, please contact support.')
  }
  const { entityName, processSet = false } = await Utils.cond(
    [entityType === undefined, () => ({})],
    [`${entityType}_set` === rootEntityType, async () => {
      await createSet()
      return { entityName: newSetName }
    }],
    [entityType === rootEntityType, async () => {
      if (_.size(entityNames) === 1) {
        return { entityName: entityNames[0] }
      } else {
        await createSet()
        return { entityName: newSetName, processSet: true }
      }
    }],
    [entityType === `${rootEntityType}_set`, () => {
      if (_.size(entityNames) > 1) {
        throw new Error('Cannot launch against multiple sets')
      }
      return { entityName: entityNames[0], processSet: true }
    }]
  )
  onProgress('launch')
  return Ajax().Workspaces.workspace(namespace, name).methodConfig(configNamespace, configName).launch({
    entityType: Utils.cond(
      [!entityName, () => undefined],
      [processSet, () => `${rootEntityType}_set`],
      () => rootEntityType
    ),
    entityName,
    expression: processSet ? `this.${rootEntityType}s` : undefined,
    useCallCache, deleteIntermediateOutputFiles
  })
}
