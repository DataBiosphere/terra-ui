import { isGoogleWorkspace, WorkspaceWrapper } from 'src/libs/workspace-utils';

import { ImportRequest } from './import-types';

type ProtectedSource = { type: 'http'; host: string } | { type: 's3'; bucket: string };

// These must be kept in sync with PROTECTED_URL_PATTERNS in import-service.
// https://github.com/broadinstitute/import-service/blob/develop/app/protected_data.py
const protectedSources: ProtectedSource[] = [
  // AnVIL production
  { type: 'http', host: 'service.prod.anvil.gi.ucsc.edu' },
  { type: 's3', bucket: 'edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1' },
  // AnVIL development
  { type: 'http', host: 'service.anvil.gi.ucsc.edu' },
  //  BioData Catalyst
  { type: 'http', host: 'gen3.biodatacatalyst.nhlbi.nih.gov' },
  { type: 's3', bucket: 'gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export' },
  { type: 's3', bucket: 'gen3-theanvil-io-pfb-export' },
];

/**
 * Determine if a PFB file is considered protected data.
 * */
export const isProtectedPfbSource = (pfbUrl: URL): boolean => {
  return protectedSources.some((source) => {
    switch (source.type) {
      case 'http':
        // Match the hostname or subdomains of protected hosts.
        return pfbUrl.hostname === source.host || pfbUrl.hostname.endsWith(`.${source.host}`);

      case 's3':
        // S3 supports multiple URL formats
        // https://docs.aws.amazon.com/AmazonS3/latest/userguide/VirtualHosting.html
        return (
          pfbUrl.hostname === `${source.bucket}.s3.amazonaws.com` ||
          (pfbUrl.hostname === 's3.amazonaws.com' && pfbUrl.pathname.startsWith(`/${source.bucket}/`))
        );

      default:
        // Use TypeScript to verify that all cases have been handled.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveGuard: never = source;
        return false;
    }
  });
};

/**
 * Determine whether an import source is considered protected.
 */
export const isProtectedSource = (importRequest: ImportRequest): boolean => {
  switch (importRequest.type) {
    case 'pfb':
      return isProtectedPfbSource(importRequest.url);
    default:
      return false;
  }
};

// This method identifies whether an import source is an AnVIL Explorer import
export const isAnvilImport = (url: string): boolean => {
  if (!url) {
    return false;
  }
  const anvilSources = [
    'service.prod.anvil.gi.ucsc.edu',
    'edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1',
  ];
  return anvilSources.some((path) => url.includes(path));
};

// This method identifies whether a workspace qualifies as protected.
// 'Protected' here means that it has enhanced logging - either on its own or because it has an auth domain.
// For now this also means only GCP workspaces are included.
export const isProtectedWorkspace = (workspace: WorkspaceWrapper): boolean => {
  if (!isGoogleWorkspace(workspace)) {
    return false;
  }
  return !!workspace.workspace.bucketName && workspace.workspace.bucketName.startsWith('fc-secure');
};
