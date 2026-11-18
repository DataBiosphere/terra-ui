import FileSaver from 'file-saver';
import { CromIAM } from 'src/libs/ajax/workflows-app/CromIAM';

// Workflow, call, and execution event details, minus bulky fields like call caching hashes,
// submitted files, and runtime attributes
export const metadataIncludeKeys = [
  'attempt',
  'backendLogs:log',
  'callCaching:hit',
  'callRoot',
  'end',
  'executionStatus',
  'failures',
  'inputs',
  'jobId',
  'outputs',
  'shardIndex',
  'start',
  'calls',
  'description',
  'executionEvents',
  'labels',
  'parentWorkflowId',
  'returnCode',
  'status',
  'submission',
  'subWorkflowId',
  'workflowName',
];
export const metadataExcludeKeys = ['callCaching:hitFailures'];

// ISO 8601 basic format in UTC, to the minute (e.g. 20261117T2043Z). The extended format's colons aren't
// allowed in filenames on every OS, and browsers rewrite them on download.
const toFilenameTimestamp = (timestamp: string): string | undefined => {
  const ms = Date.parse(timestamp);
  return Number.isNaN(ms) ? undefined : `${new Date(ms).toISOString().slice(0, 16).replace(/[-:]/g, '')}Z`;
};

// Prefixed with the workflow's submission time so multiple downloads sort chronologically
export const workflowMetadataFilename = (workflowId: string, metadata: { submission?: string }): string => {
  const prefix = metadata.submission && toFilenameTimestamp(metadata.submission);
  return prefix ? `${prefix}-${workflowId}-metadata.json` : `${workflowId}-metadata.json`;
};

export const downloadWorkflowMetadata = async (workflowId: string): Promise<void> => {
  const metadata = await CromIAM().workflowMetadata(workflowId, metadataIncludeKeys, metadataExcludeKeys);
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  FileSaver.saveAs(blob, workflowMetadataFilename(workflowId, metadata));
};
