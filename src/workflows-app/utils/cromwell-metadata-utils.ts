import { Ajax } from 'src/libs/ajax';

export type MetadataOptions = {
  cromwellProxyUrl: string;
  excludeKeys: string[];
  includeKeys: string[];
  signal: AbortSignal;
  workflowId: string;
};

export type WorkflowMetadata = {
  actualWorkflowLanguage: string;
  actualWorkflowLanguageVersion: string;
  calls: {};
  end: string;
  id: string;
  inputs: {}[];
  labels: {};
  outputs: {}[];
  start: string;
  status: string;
  submission: string;
  submittedFiles: {};
  workflowCallback: {};
  workflowLog: string;
  workflowName: string;
  workflowProcessingEvents: {}[];
  workflowRoot: string;
};

export const fetchMetadata = async (options: MetadataOptions): Promise<WorkflowMetadata> =>
  Ajax(options.signal)
    .CromwellApp.workflows(options.workflowId)
    .metadata(options.cromwellProxyUrl, { includeKey: options.includeKeys, excludeKey: options.excludeKeys });
