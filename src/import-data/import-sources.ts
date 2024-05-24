export type UrlSource = { type: 'http'; host: string } | { type: 's3'; bucket: string };

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

export type ImportSource = 'anvil' | '';

/**
 * This method identifies an import source. Currently it only identifies AnVIL Explorer.
 */
export const getImportSource = (url: URL): ImportSource => {
  const anvilSources = [
    // AnVIL production
    'service.prod.anvil.gi.ucsc.edu',
    'edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1',
    // AnVIL development
    'service.anvil.gi.ucsc.edu',
    'edu-ucsc-gi-platform-anvil-dev-storage-anvildev.us-east-1',
  ];
  if (anvilSources.some((path) => url.href.includes(path))) {
    return 'anvil';
  }
  return '';
};
