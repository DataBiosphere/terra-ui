import _ from 'lodash/fp'


export const workflowNameValidation = () => {
  return ({
    presence: { allowEmpty: false },
    format: {
      pattern: /^[A-Za-z0-9_\-.]*$/,
      message: 'can only contain letters, numbers, underscores, dashes, and periods'
    }
  })
}

export const getWorkflowInputSuggestionsForAttributesOfSetMembers = (selectedEntities, entityMetadata) => {
  return _.flow(
    // Collect attributes of selected entities
    _.values,
    _.flatMap(_.flow(_.get('attributes'), _.toPairs)),
    // Find attributes that reference other entities
    // eslint-disable-next-line no-unused-vars
    _.filter(([attributeName, attributeValue]) => _.get('itemsType', attributeValue) === 'EntityReference'),
    // Find all entity types that are referenced by each attribute
    _.flatMap(([attributeName, { items }]) => {
      return _.flow(
        _.map(_.get('entityType')),
        _.uniq,
        _.map(entityType => [attributeName, entityType])
      )(items)
    }),
    _.uniqBy(([attributeName, entityType]) => `${attributeName}|${entityType}`),
    // Use entity metadata to list attributes for each referenced entity type
    _.flatMap(([attributeName, entityType]) => {
      return _.flow(
        _.over([
          _.get([entityType, 'attributeNames']),
          _.get([entityType, 'idName'])
        ]),
        _.spread(_.concat),
        _.map(nestedAttributeName => `this.${attributeName}.${nestedAttributeName}`)
      )(entityMetadata)
    }),
    // Sort and remove duplicates
    _.sortBy(_.identity),
    _.sortedUniq
  )(selectedEntities)
}
