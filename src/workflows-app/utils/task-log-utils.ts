export type LogInfo = {
  logTitle: string;
  tooltipKey: string;
  filenameSubstring: string;
};

// We will display a subset of these logs in the UI.
// As of 01/2024, we expect the cromwell backend to supply blob paths for stdout, stderr, tes_stdout, and tes_stderr.
// Depending on the TES version used at the time of workflow execution, the tes_stdout and tes_stderr logs might not exist. If they don't,
// we expect the exec/download/upload logs to exist instead. We can use the blob path for tes_stdout to query & search for the other logs.
export const PotentialTaskLogs: Map<string, LogInfo> = new Map([
  ['stdout', { logTitle: 'Task Standard Out', tooltipKey: 'stdout', filenameSubstring: 'stdout' }],
  ['stderr', { logTitle: 'Task Standard Err', tooltipKey: 'stderr', filenameSubstring: 'stderr' }],
  ['tes_stdout', { logTitle: 'Backend Standard Out', tooltipKey: 'tes_stdout', filenameSubstring: 'stdout.txt' }],
  ['tes_stderr', { logTitle: 'Backend Standard Err', tooltipKey: 'tes_stderr', filenameSubstring: 'stderr.txt' }],
  ['exec_stdout', { logTitle: 'Backend Standard Out', tooltipKey: 'tes_stdout', filenameSubstring: 'exec_stdout' }],
  ['exec_stderr', { logTitle: 'Backend Standard Err', tooltipKey: 'tes_stderr', filenameSubstring: 'exec_stderr' }],
  [
    'download_stdout',
    { logTitle: 'Download Standard Out', tooltipKey: 'tes_stdout', filenameSubstring: 'download_stdout' },
  ],
  [
    'download_stderr',
    { logTitle: 'Download Standard Err', tooltipKey: 'tes_stderr', filenameSubstring: 'download_stderr' },
  ],
  ['upload_stdout', { logTitle: 'Upload Standard Out', tooltipKey: 'tes_stdout', filenameSubstring: 'upload_stdout' }],
  ['upload_stderr', { logTitle: 'Upload Standard Err', tooltipKey: 'tes_stderr', filenameSubstring: 'upload_stderr' }],
]);

export const parseLogPathIntoContainerDirectory = (workspaceId: string, logBlobPath: string): string => {
  const index = logBlobPath.indexOf(workspaceId);
  if (index === -1) {
    console.error(`Could not find workspaceId ${workspaceId} in log path of ${logBlobPath}`);
  }
  const blobFilepath = logBlobPath.substring(index + workspaceId.length + 1); // remove the workspaceId, following slash, and everything before it
  const blobDirectory = blobFilepath.substring(0, blobFilepath.lastIndexOf('/')); // remove the filename
  return blobDirectory;
};
