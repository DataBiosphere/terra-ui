import _ from 'lodash/fp';
import * as Utils from 'src/libs/utils';
import { getAttributeType } from 'src/workspace-data/data-table/entity-service/attribute-utils';

export const entityAttributeText = (attributeValue, machineReadable) => {
  const { type, isList } = getAttributeType(attributeValue);

  return Utils.cond(
    [_.isNil(attributeValue), () => ''],
    [type === 'json', () => JSON.stringify(attributeValue)],
    [isList && machineReadable, () => JSON.stringify(attributeValue.items)],
    [type === 'reference' && isList, () => _.join(', ', _.map('entityName', attributeValue.items))],
    [type === 'reference', () => attributeValue.entityName],
    [isList, () => _.join(', ', attributeValue.items)],
    () => attributeValue?.toString()
  );
};
