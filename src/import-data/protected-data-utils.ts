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
export const isProtectedPfbSource = (pfbUrl: string): boolean => {
  const parsedUrl = new URL(pfbUrl);
  return protectedSources.some((source) => {
    if (source.type === 'http') {
      // Match the hostname or subdomains of protected hosts.
      return parsedUrl.hostname === source.host || parsedUrl.hostname.endsWith(`.${source.host}`);
    }

    if (source.type === 's3') {
      // S3 supports multiple URL formats
      // https://docs.aws.amazon.com/AmazonS3/latest/userguide/VirtualHosting.html
      return (
        parsedUrl.hostname === `${source.bucket}.s3.amazonaws.com` ||
        (parsedUrl.hostname === 's3.amazonaws.com' && parsedUrl.pathname.startsWith(`/${source.bucket}/`))
      );
    }

    return false;
  });
};

/**
 * Determine whether an import source is considered protected.
 */
export const isProtectedSource = (importRequest: ImportRequest): boolean => {
  if (importRequest.type === 'pfb') {
    return isProtectedPfbSource(importRequest.url);
  }
  return false;
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
