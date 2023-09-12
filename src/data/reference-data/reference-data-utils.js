import _ from 'lodash/fp';

export const getReferenceData = _.flow(
  _.toPairs,
  _.filter(([key]) => key.startsWith('referenceData_')),
  _.map(([k, value]) => {
    const [, datum, key] = /referenceData_([^_]+)_(.+)/.exec(k);
    return { datum, key, value };
  }),
  _.groupBy('datum')
);
