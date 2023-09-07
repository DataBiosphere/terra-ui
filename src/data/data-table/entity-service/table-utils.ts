import _ from 'lodash/fp';

export const getRootTypeForSetTable = (tableName: string): string => _.replace(/(_set)+$/, '', tableName);
