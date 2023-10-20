import { Snapshot } from 'src/libs/ajax/DataRepo';
import { hasProtectedData, WorkspaceWrapper } from 'src/libs/workspace-utils';

import { ImportRequest } from './import-types';

type ProtectedSource = { type: 'http'; host: string } | { type: 's3'; bucket: string };

export type ImportSource = 'anvil' | '';

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
 */
const isProtectedPfbSource = (pfbUrl: URL): boolean => {
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
 * Determine if a TDR snapshot is considered protected data.
 */
const isProtectedSnapshotSource = (snapshot: Snapshot): boolean => {
  return snapshot.source.some((source) => source.dataset.secureMonitoringEnabled);
};

/**
 * Determine whether an import source is considered protected.
 */
export const isProtectedSource = (importRequest: ImportRequest): boolean => {
  switch (importRequest.type) {
    case 'pfb':
      return isProtectedPfbSource(importRequest.url);
    case 'tdr-snapshot-export':
    case 'tdr-snapshot-reference':
      return isProtectedSnapshotSource(importRequest.snapshot);
    default:
      return false;
  }
};

/**
 * This method identifies an import source. Currently it only identifies AnVIL Explorer.
 */
export const getImportSource = (url: URL): ImportSource => {
  const anvilSources = [
    'service.prod.anvil.gi.ucsc.edu',
    'edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1',
  ];
  if (anvilSources.some((path) => url.href.includes(path))) {
    return 'anvil';
  }
  return '';
};

/**
 * Determine whether a workspace is considred protected.
 *
 * For Azure workspaces, this checks for the "protected-data" policy.
 * For Google workspaces, this checks for has enhanced logging - either directly or from an auth domain.
 *
 * @param workspace - The workspace.
 */
export const isProtectedWorkspace = (workspace: WorkspaceWrapper): boolean => {
  switch (workspace.workspace.cloudPlatform) {
    case 'Azure':
      return hasProtectedData(workspace);
    case 'Gcp':
      return workspace.workspace.bucketName.startsWith('fc-secure');
    default:
      // Check that all possible cases are handled.
      const exhaustiveGuard: never = workspace.workspace;
      return exhaustiveGuard;
  }
};
