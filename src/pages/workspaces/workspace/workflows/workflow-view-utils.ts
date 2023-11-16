import _ from 'lodash/fp';

export const sanitizeAttributeUpdateString = (rawUpdate: string): string => {
  return _.isString(rawUpdate) && rawUpdate.match(/\${([\s\S]*)}/)
    ? rawUpdate.replace(/\${([\s\S]*)}/, (_, match) => match)
    : JSON.stringify(rawUpdate);
};
