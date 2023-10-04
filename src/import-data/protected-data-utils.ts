import { cond } from '@terra-ui-packages/core-utils';
import { isGoogleWorkspace, WorkspaceWrapper } from 'src/libs/workspace-utils';

// This method identifies whether an import source is considered protected data;
// For now this means pfb imports from AnVIL or Biodata Catalyst.
export const isProtectedSource = (url: string, filetype?: string): boolean => {
  if (!url) {
    return false;
  }
  try {
    const hostname = new URL(url).hostname;
    const protectedHosts = [
      'anvil.gi.ucsc.edu',
      'anvilproject.org',
      'gen3.biodatacatalyst.nhlbi.nih.gov',
      'gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export.s3.amazonaws.com',
      'gen3-theanvil-io-pfb-export.s3.amazonaws.com',
    ];
    return cond([!filetype || !url, () => false], [!!filetype && filetype.toLowerCase() !== 'pfb', () => false], () =>
      protectedHosts.some((host) => hostname.endsWith(host))
    );
  } catch (e) {
    console.error(`Unable to parse url: ${url}`);
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
