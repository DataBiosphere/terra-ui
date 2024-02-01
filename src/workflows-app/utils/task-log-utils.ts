import { Ajax } from 'src/libs/ajax';
import { LogInfo } from 'src/workflows-app/components/LogViewer';

export const workflowExecutionLogTooltip =
  'Each workflow has a single execution log which comes from the engine running your workflow. Errors in this log might indicate a Terra systems issue, or a problem parsing your WDL.';
export const taskLogTooltip =
  "Task logs are from user-defined commands in your WDL. You might see an error in these logs if there was a logic or syntax error in a command, or if something went wrong with the tool you're running.";
const backendLogTooltip =
  "Backend logs are from the Azure Cloud compute job that prepares your task to run and cleans up afterwards. You might see errors in these logs if the there was a problem downloading the task's input files, pulling its container, or if something went wrong on the compute node while the task was running.";
const downloadLogTooltip =
  'Download logs are from the process of downloading task input files from the cloud onto the compute node.';
const uploadLogTooltip =
  'Upload logs are from the process of uploading task output files from the compute node to the workspace data table.';
// We will display a subset of these logs in the UI.
// As of 01/2024, we expect the cromwell backend to supply blob paths for stdout, stderr, tes_stdout, and tes_stderr.
// Depending on the TES version used at the time of workflow execution, the tes_stdout and tes_stderr logs might not exist. If they don't,
// we expect the exec/download/upload logs to exist instead. We can use the blob path for tes_stdout to query & search for the other logs.
const potentialTesLogs: LogInfo[] = [
  {
    logUri: undefined,
    logTitle: 'Backend Standard Out',
    logKey: 'tes_stdout',
    logFilename: 'stdout.txt',
    logTooltip: backendLogTooltip,
  },
  {
    logUri: undefined,
    logTitle: 'Backend Standard Err',
    logKey: 'tes_stderr',
    logFilename: 'stderr.txt',
    logTooltip: backendLogTooltip,
  },
  {
    logUri: undefined,
    logTitle: 'Exec Standard Out',
    logKey: 'tes_exec_stdout',
    logFilename: 'exec_stdout',
    logTooltip: backendLogTooltip,
  },
  {
    logUri: undefined,
    logTitle: 'Exec Standard Err',
    logKey: 'tes_exec_stderr',
    logFilename: 'exec_stderr',
    logTooltip: backendLogTooltip,
  },
  {
    logUri: undefined,
    logTitle: 'Download Standard Out',
    logKey: 'tes_download_stdout',
    logFilename: 'download_stdout',
    logTooltip: downloadLogTooltip,
  },
  {
    logUri: undefined,
    logTitle: 'Download Standard Error',
    logKey: 'tes_download_stderr',
    logFilename: 'download_stderr',
    logTooltip: downloadLogTooltip,
  },
  {
    logUri: undefined,
    logTitle: 'Upload Standard Out',
    logKey: 'tes_upload_stdout',
    logFilename: 'upload_stdout',
    logTooltip: uploadLogTooltip,
  },
  {
    logUri: undefined,
    logTitle: 'Upload Standard Err',
    logKey: 'tes_upload_stderr',
    logFilename: 'upload_stderr',
    logTooltip: uploadLogTooltip,
  },
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
