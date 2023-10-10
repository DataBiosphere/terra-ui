import _ from 'lodash/fp';

import { referenceMetadata } from './reference-metadata';

export const getReferenceData = _.flow(
  _.toPairs,
  _.filter(([key]) => key.startsWith('referenceData_')),
  _.map(([k, value]) => {
    // Assume that all keys starting with "referenceData_" were created by
    // importing reference data and thus match this format.
    const [, datum, key] = /referenceData_([^_]+)_(.+)/.exec(k)!;
    return { datum, key, value };
  }),
  _.groupBy('datum')
);

export const getReferenceLabel = (referenceName: string): string => {
  const metadata = referenceMetadata[referenceName];
  const species = metadata ? metadata.species : 'Unknown';
  return `${species}: ${referenceName}`;
};
