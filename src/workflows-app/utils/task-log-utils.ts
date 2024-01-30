import { Ajax } from 'src/libs/ajax';
import { LogInfo } from 'src/workflows-app/components/LogViewer';

// We will display a subset of these logs in the UI.
// As of 01/2024, we expect the cromwell backend to supply blob paths for stdout, stderr, tes_stdout, and tes_stderr.
// Depending on the TES version used at the time of workflow execution, the tes_stdout and tes_stderr logs might not exist. If they don't,
// we expect the exec/download/upload logs to exist instead. We can use the blob path for tes_stdout to query & search for the other logs.
const potentialTesLogs: LogInfo[] = [
  { logUri: undefined, logTitle: 'Backend Standard Out', logKey: 'tes_stdout', logFilename: 'stdout.txt' },
  { logUri: undefined, logTitle: 'Backend Standard Err', logKey: 'tes_stderr', logFilename: 'stderr.txt' },
  { logUri: undefined, logTitle: 'Exec Standard Out', logKey: 'tes_exec_stdout', logFilename: 'exec_stdout' },
  { logUri: undefined, logTitle: 'Exec Standard Err', logKey: 'tes_exec_stderr', logFilename: 'exec_stderr' },
  {
    logUri: undefined,
    logTitle: 'Download Standard Out',
    logKey: 'tes_download_stdout',
    logFilename: 'download_stdout',
  },
  {
    logUri: undefined,
    logTitle: 'Download Standard Error',
    logKey: 'tes_download_stderr',
    logFilename: 'download_stderr',
  },
  { logUri: undefined, logTitle: 'Upload Standard Out', logKey: 'tes_upload_stdout', logFilename: 'upload_stdout' },
  { logUri: undefined, logTitle: 'Upload Standard Err', logKey: 'tes_upload_stderr', logFilename: 'upload_stderr' },
];

const parseFullFilepathToContainerDirectory = (workspaceId: string, logBlobPath: string): string => {
  const index = logBlobPath.indexOf(workspaceId);
  if (index === -1) {
    console.error(`Could not find workspaceId ${workspaceId} in log path of ${logBlobPath}`);
  }
  const blobFilepath = logBlobPath.substring(index + workspaceId.length + 1); // remove the workspaceId, following slash, and everything before it
  const blobDirectory = blobFilepath.substring(0, blobFilepath.lastIndexOf('/')); // remove the filename
  return blobDirectory;
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

  const pathPrefix = tesLogBlobPath.substring(0, tesLogBlobPath.indexOf(workspaceId) + workspaceId.length + 1);

  for (const potentialLog of potentialTesLogs) {
    const filenameToLookFor = potentialLog.logFilename;
    const foundLog = allFilesInTesDirectory.find((file) => file.name.includes(filenameToLookFor));
    if (!foundLog) {
      // Log not found in blob storage
      continue;
    }
    potentialLog.logUri = pathPrefix + foundLog.name;
    logs.push(potentialLog);
  }
  return logs;
};
