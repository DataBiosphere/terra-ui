import _ from 'lodash/fp'


export const renderTypeText = iotype => {
  if (_.has('primitive_type', iotype)) {
    return iotype.primitive_type
  }
  if (_.has('optional_type', iotype)) {
    return `${renderTypeText(_.get('optional_type', iotype))}`
  }
  if (_.has('array_type', iotype)) {
    return `Array[${renderTypeText(_.get('array_type', iotype))}]`
  }
  if (_.get('type', iotype) === 'map') {
    return `Map[${_.get('key_type', iotype)}, ${renderTypeText(_.get('value_type', iotype))}]`
  }
  if (_.get('type', iotype) === 'struct') {
    return 'Struct'
  }
  return 'Unsupported Type'
}


export const isInputOptional = ioType => _.get('type', ioType) === 'optional'

export const inputTypeStyle = iotype => {
  if (_.get('type', iotype) === 'optional') {
    return { fontStyle: 'italic' }
  } else {
    return {}
  }
}
