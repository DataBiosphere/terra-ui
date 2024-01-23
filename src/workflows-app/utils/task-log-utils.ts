import { Ajax } from 'src/libs/ajax';

export type LogInfo = {
  logTitle: string;
  tooltipKey: string;
  filenameSubstring: string;
  blobUri?: string; // blobURI is not known until runtime
};

// We will display a subset of these logs in the UI.
// As of 01/2024, we expect the cromwell backend to supply blob paths for stdout, stderr, tes_stdout, and tes_stderr.
// Depending on the TES version used at the time of workflow execution, the tes_stdout and tes_stderr logs might not exist. If they don't,
// we expect the exec/download/upload logs to exist instead. We can use the blob path for tes_stdout to query & search for the other logs.
const PotentialTaskLogs: Map<string, LogInfo> = new Map([
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

const parseFullFilepathToContainerDirectory = (workspaceId: string, logBlobPath: string): string => {
  const index = logBlobPath.indexOf(workspaceId);
  if (index === -1) {
    console.error(`Could not find workspaceId ${workspaceId} in log path of ${logBlobPath}`);
  }
  const blobFilepath = logBlobPath.substring(index + workspaceId.length + 1); // remove the workspaceId, following slash, and everything before it
  const blobDirectory = blobFilepath.substring(0, blobFilepath.lastIndexOf('/')); // remove the filename
  return blobDirectory;
};

const getLogInfo = (logKey: string, blobPath: string) => {
  const logInfo = PotentialTaskLogs.get(logKey);
  if (!logInfo || !blobPath) {
    console.error(`Could not find log info for logKey ${logKey}`);
  } else {
    logInfo.blobUri = blobPath;
  }
  return logInfo;
};

export const discoverTesLogs = async (signal, workspaceId: string, tesLogBlobPath: string) => {
  const logs: LogInfo[] = [];

  if (!tesLogBlobPath) {
    console.error("Error: tes_stdout key is missing from task metadata. Can't fetch logs.");
    return logs;
  }

  // we're not entirely sure which logs will exist in blob storage, so we fetch all files in the directory of the tes_stdout file and search for the files we want.
  const allFilesInTesDirectory = await Ajax(signal).AzureStorage.listFiles(
    workspaceId,
    parseFullFilepathToContainerDirectory(workspaceId, tesLogBlobPath)
  );

  const tesLogKeys = [
    'tes_stdout',
    'tes_stderr',
    'exec_stdout',
    'exec_stderr',
    'download_stdout',
    'download_stderr',
    'upload_stdout',
    'upload_stderr',
  ];

  for (const logKey of tesLogKeys) {
    const filenameToLookFor = PotentialTaskLogs.get(logKey)?.filenameSubstring;
    if (!filenameToLookFor) {
      // Programmer error: log key not found in PotentialTaskLogs
      continue;
    }
    const foundLog = allFilesInTesDirectory.find((file) => file.name.includes(filenameToLookFor));
    if (!foundLog) {
      // Log not found in blob storage
      continue;
    }
    const logInfo = getLogInfo(logKey, foundLog.name);
    if (logInfo) {
      logs.push(logInfo);
    }
  }
  return logs;
};
