import _ from 'lodash/fp';

const azureRegex = RegExp('^https://(.+).blob.core.windows.net');
export const isAzureUri = (uri: string): boolean => azureRegex.test(uri);

export const isGsUri = (uri: string): boolean => _.startsWith('gs://', uri);

export const isDrsUri = (uri: string): boolean => _.startsWith('dos://', uri) || _.startsWith('drs://', uri);
