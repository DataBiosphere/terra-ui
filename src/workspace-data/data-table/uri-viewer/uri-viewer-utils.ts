import _ from 'lodash/fp';

const azureRegex = RegExp('^https://(.+).blob.core.windows.net');
export const isAzureUri = (uri: string): boolean => azureRegex.test(uri);

export const isGsUri = (uri: string): boolean => _.startsWith('gs://', uri);

export const isDrsUri = (uri: string): boolean => _.startsWith('dos://', uri) || _.startsWith('drs://', uri);

type AccessUrl = {
  url: string;
  headers: { [key: string]: string };
};

export const getDownloadCommand = (
  fileName: string,
  uri: string,
  useFileName: boolean,
  accessUrl?: AccessUrl
): string | undefined => {
  const { url: httpUrl, headers: httpHeaders } = accessUrl || {};
  if (httpUrl) {
    const headers = _.flow(
      _.toPairs,
      _.reduce((acc, [header, value]) => `${acc}-H '${header}: ${value}' `, '')
      // @ts-expect-error
    )(httpHeaders);
    const output = fileName ? `-o '${fileName}' ` : '-O ';
    return `curl ${headers}${output}'${httpUrl}'`;
  }

  if (isAzureUri(uri)) {
    return `azcopy copy '${uri}' ${useFileName && fileName ? `'${fileName}'` : '.'}`;
  }

  if (isGsUri(uri)) {
    return `gsutil cp '${uri}' ${useFileName && fileName ? `'${fileName}'` : '.'}`;
  }
};
