import { Ajax } from 'src/libs/ajax';

// Returned in the 'calls' array field of the metadata response from cromwell.
// This represents a task OR a subworkflow.
// Note that not all fields will be present in the response, as this depends on the include keys used in the request.
export interface WorkflowTask {
  tes_stderr?: string; // URL to the TES stderr file for the task (not to be confused with the Cromwell tasks's stderr)
  tes_stdout?: string; // URL to the TES stdout file for the task (not to be confused with the Cromwell tasks's stdout)
  executionStatus?: string; // The status of the task (e.g. 'Done', 'Running', 'Failed')
  stdout?: string; // URL to the Cromwell task's stdout file
  stderr?: string; // URL to the Cromwell task's stderr file
  backendStatus?: string;
  shardIndex?: number; // The shard index of the task. -1 if not a scatter task.
  outputs?: {}; // The output values of this task
  callCaching?: {
    allowResultReuse: boolean;
    effectiveCallCachingMode: string;
  };
  inputs?: {}; // The input values of this task
  jobId?: string; // The job ID of the task
  start?: string; // The start time of the task
  end?: string; // The end time of the task
  attempt?: number; // How many times this task has been attempted
}

export interface WorkflowMetadata {
  actualWorkflowLanguage?: string;
  actualWorkflowLanguageVersion?: string;
  calls?: any[];
  end?: string;
  id?: string;
  inputs?: {}[];
  labels?: {};
  outputs?: {}[];
  start?: string;
  status?: string;
  submission?: string;
  submittedFiles?: {
    workflow: string;
    root?: string;
    options?: string;
    inputs: string;
    workflowUrl?: string;
    labels?: string;
  };
  workflowCallback?: {};
  workflowLog?: string;
  workflowName?: string;
  workflowProcessingEvents?: {}[];
  workflowRoot?: string;
  metadataArchiveStatus?: string;
}

export interface SubworkflowMetadata extends WorkflowMetadata {
  subworkflowId: string;
}

// Used to make a web request to cromwell to get certain pieces of metadata for a specific workflow
export type MetadataOptions = {
  cromwellProxyUrl: string;
  excludeKeys: string[];
  includeKeys: string[];
  signal: AbortSignal;
  workflowId: string;
  expandSubWorkflows: boolean;
};

export const fetchMetadata = async (options: MetadataOptions): Promise<WorkflowMetadata> =>
  Ajax(options.signal).CromwellApp.workflows(options.workflowId).metadata(options.cromwellProxyUrl, {
    includeKey: options.includeKeys,
    excludeKey: options.excludeKeys,
    expandSubWorkflows: options.expandSubWorkflows,
  });

export interface FetchMetadataOptions {
  cromwellProxyUrl: string;
  signal: AbortSignal;
  workflowId: string;
}

// Big web request that fetches the data necessary for the call table
export const fetchWorkflowAndCallsMetadata = async (fetchOptions: FetchMetadataOptions): Promise<WorkflowMetadata> => {
  const options: MetadataOptions = {
    cromwellProxyUrl: fetchOptions.cromwellProxyUrl,
    excludeKeys: [],
    includeKeys: [
      'backendStatus',
      'executionStatus',
      'shardIndex',
      'outputs',
      'inputs',
      'jobId',
      'start',
      'end',
      'stderr',
      'stdout',
      'tes_stdout',
      'tes_stderr',
      'attempt',
      'subWorkflowId', // needed for task type column
      'status',
      'submittedFiles',
      'callCaching',
      'workflowLog',
      'failures',
      'taskStartTime',
      'taskEndTime',
      'vmCostUsd',
      'workflowName',
    ],
    signal: fetchOptions.signal,
    workflowId: fetchOptions.workflowId,
    expandSubWorkflows: false,
  };
  return fetchMetadata(options);
};

export const fetchCostMetadata = async (fetchOptions: FetchMetadataOptions): Promise<WorkflowMetadata> => {
  const options: MetadataOptions = {
    cromwellProxyUrl: fetchOptions.cromwellProxyUrl,
    excludeKeys: [],
    includeKeys: ['calls', 'subWorkflowId', 'taskStartTime', 'taskEndTime', 'vmCostUsd'],
    signal: fetchOptions.signal,
    workflowId: fetchOptions.workflowId,
    expandSubWorkflows: true,
  };
  return fetchMetadata(options);
};

// Returns the cost in USD of a given task.
// Tasks are the leaf nodes of the metadata graph, and are the only things that actually cost money. The cost of a (sub)workflow is the sum of the costs of its tasks.
const calculateTaskCost = (taskStartTime: string, vmCostUsd: string, taskEndTime?: string): number => {
  const endTime = taskEndTime ? Date.parse(taskEndTime) : Date.now(); // Tasks with no end time are still running, so use now as the end time
  const vmCostDouble = parseFloat(vmCostUsd);
  const startTime = Date.parse(taskStartTime);
  const elapsedTime = endTime - startTime;
  return parseFloat(((elapsedTime / 3600000) * vmCostDouble).toFixed(2)); // 1 hour = 3600000 ms
};

// Returns the cost in USD of a single call attempt.
// A 'call' is either a task or a subworkflow. Subworkflows contain their own 'calls' array, which can be recursively searched.
const calculateCostOfCallAttempt = (taskOrSubworkflow: any): number => {
  let totalCost = 0;
  if (taskOrSubworkflow.taskStartTime && taskOrSubworkflow.vmCostUsd) {
    totalCost += calculateTaskCost(
      taskOrSubworkflow.taskStartTime,
      taskOrSubworkflow.vmCostUsd,
      taskOrSubworkflow.taskEndTime
    );
  } else if (taskOrSubworkflow.subWorkflowMetadata) {
    totalCost += calculateCostOfCallsArray(taskOrSubworkflow.subWorkflowMetadata.calls);
  } else {
    console.error('Could not calculate cost of task or subworkflow', taskOrSubworkflow);
  }
  return totalCost;
};

// Helper function to sum up the costs of everything in a 'calls' array, which is owned by a (sub)workflow.
// N.B. Don't confuse the 'calls' array with the array of attmepts for a single call.
export const calculateCostOfCallsArray = (callsArray: any): number => {
  if (!callsArray) {
    console.error('Could not calculate cost of calls array', callsArray);
    return 0;
  }
  let totalCost = 0;
  // Each workflow has a calls array, which is a list of all its child tasks and subworkflows ("calls").
  // Each call itself is an array of attempts, where each attempt is an actual task or subworkflow.
  for (const callAttemptsArray of Object.values(callsArray) as any[]) {
    totalCost += sumCostsOfCallAttempts(callAttemptsArray);
  }
  return totalCost;
};

// Helper function to sum up the costs of all the attempts for a single call.
// N.B. Don't confuse the attempts array of a single call with the 'calls' array of a (sub)workflow.
export const sumCostsOfCallAttempts = (callAttempts: any[]): number => {
  let totalCost = 0;
  for (const taskOrSubworkflowAttempt of callAttempts) {
    totalCost += calculateCostOfCallAttempt(taskOrSubworkflowAttempt);
  }
  return totalCost;
};

// Recursively searches the metadata for a call with the given name.
// Returns the array of attempts for that call if found, otherwise returns undefined.
export const findCallAttemptsByCallNameInCostGraph = (callName: string, costMetadata: any) => {
  // For every call in the workflow
  for (const callKey of Object.keys(costMetadata.calls)) {
    // If the call is the one we're looking for, return it
    if (callKey === callName) {
      return costMetadata.calls[callKey];
    }
    // If the call is a subworkflow, search its calls
    const callAttemptArray = costMetadata.calls[callKey];
    if (callAttemptArray && Array.isArray(callAttemptArray) && callAttemptArray.length > 0) {
      const lastAttempt = callAttemptArray[callAttemptArray.length - 1];
      if (lastAttempt.subWorkflowMetadata) {
        const foundCall = findCallAttemptsByCallNameInCostGraph(callName, lastAttempt.subWorkflowMetadata);
        if (foundCall) {
          return foundCall;
        }
      }
    }
  }
  // Failed to find the call in the cost graph
  return undefined;
};
