import FileSaver from 'file-saver'
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
    _.filter(([_attributeName, attributeValue]) => _.get('itemsType', attributeValue) === 'EntityReference'),
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

export const ioTask = ioName => _.nth(-2, ioName.split('.'))
export const ioVariable = ioName => _.nth(-1, ioName.split('.'))

export const downloadIO = (io, filename) => {
  const prepIO = _.mapValues(v => /^".*"/.test(v) ? v.slice(1, -1) : `\${${v}}`)

  const blob = new Blob([JSON.stringify(prepIO(io))], { type: 'application/json' })
  FileSaver.saveAs(blob, `${filename}.json`)
}
