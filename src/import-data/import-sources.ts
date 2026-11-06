import { ImportRequest } from './import-types';

export type UrlSource = { source: string; type: 'http'; host: string } | { source: string; type: 's3'; bucket: string };

export const anvilSources: UrlSource[] = [
  // production
  { source: 'anvil', type: 'http', host: 'service.prod.anvil.gi.ucsc.edu' },
  { source: 'anvil', type: 's3', bucket: 'edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1' },
  { source: 'anvil', type: 'http', host: 'redcaptest.vumc.org' },
  { source: 'anvil', type: 'http', host: 'redcap.vumc.org' },
  // development
  { source: 'anvil', type: 'http', host: 'service.anvil.gi.ucsc.edu' },
  { source: 'anvil', type: 's3', bucket: 'edu-ucsc-gi-platform-anvil-dev-storage-anvildev.us-east-1' },
];

export const biodatacatalystSources: UrlSource[] = [
  { source: 'biodatacatalyst', type: 'http', host: 'gen3.biodatacatalyst.nhlbi.nih.gov' },
  { source: 'biodatacatalyst', type: 's3', bucket: 'gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export' },
  { source: 'biodatacatalyst', type: 's3', bucket: 'gen3-theanvil-io-pfb-export' },
  { source: 'biodatacatalyst', type: 's3', bucket: 'cdis-presigned-url-test' },
];

/**
 * Determine if a PFB file is considered protected data.
 */
export const urlMatchesSource = (url: URL, source: UrlSource): boolean => {
  switch (source.type) {
    case 'http':
      // Match the hostname or subdomains of protected hosts.
      return url.hostname === source.host || url.hostname.endsWith(`.${source.host}`);

    case 's3':
      // S3 supports multiple URL formats
      // https://docs.aws.amazon.com/AmazonS3/latest/userguide/VirtualHosting.html
      return (
        url.hostname === `${source.bucket}.s3.amazonaws.com` ||
        (url.hostname === 's3.amazonaws.com' && url.pathname.startsWith(`/${source.bucket}/`))
      );

    default:
      // Use TypeScript to verify that all cases have been handled.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveGuard: never = source;
      return false;
  }
};

export const isBiodatacatalystImport = (urlSource: UrlSource): boolean => {
  const requiredWords = ['nih', 'nhlbi', 'biodata', 'catalyst'];
  return requiredWords.every((word) => urlSource.source.includes(word));
};

export const isAnvilImport = (importRequest: ImportRequest): boolean => {
  return 'url' in importRequest && anvilSources.some((source) => urlMatchesSource(importRequest.url, source));
};

export type ImportSource = 'anvil';

/**
 * This method identifies an import source for metrics. Currently it only identifies AnVIL Explorer.
 */
export const getImportSource = (importRequest: ImportRequest): ImportSource | undefined => {
  return isAnvilImport(importRequest) ? 'anvil' : undefined;
};
