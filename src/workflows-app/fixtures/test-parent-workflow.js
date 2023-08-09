import { commonWorkflowAttributes, failures } from 'src/workflows-app/fixtures/failed-tasks';

export const metadata = {
  workflowName: 'main_workflow',
  workflowProcessingEvents: [
    {
      cromwellId: 'cromid-a914842',
      description: 'PickedUp',
      timestamp: '2023-06-18T15:49:34.661Z',
      cromwellVersion: '86-17efd59-SNAP',
    },
    {
      cromwellId: 'cromid-a914842',
      description: 'Finished',
      timestamp: '2023-06-18T15:50:33.421Z',
      cromwellVersion: '86-17efd59-SNAP',
    },
  ],
  actualWorkflowLanguageVersion: '1.0',
  submittedFiles: {
    workflow:
      // eslint-disable-next-line no-template-curly-in-string
      'version 1.0\n\nimport "testworkflow.wdl" as sub\n\ntask start {\n  command {\n    echo "${2/0}"\n  }\n  output {\n    String out = read_string(stdout())\n  }\n}\n\ntask done {\n  command {\n    echo "${2/0}"\n  }\n  output {\n    String out = read_string(stdout())\n  }\n}\n\nworkflow main_workflow {\n  call start\n  call sub.wf_scattering\n  call done\n}\n',
    workflowTypeVersion: '1.0',
    options: '{\n\n}',
    inputs: '{}',
    workflowType: 'WDL',
    root: '',
    workflowUrl: '',
    labels: '{}',
  },
  calls: {
    'main_workflow.done': [
      {
        stdout: '/Users/jthomas/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-done/execution/stdout',
        shardIndex: -1,
        ...commonWorkflowAttributes,
        end: '2023-06-18T15:50:27.947Z',
        start: '2023-06-18T15:49:37.278Z',
        stderr: '/Users/jthomas/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-done/execution/stderr',
        callRoot: '/Users/jthomas/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-done',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-06-18T15:49:37.345Z',
            description: 'RequestingExecutionToken',
            endTime: '2023-06-18T15:49:43.170Z',
          },
          {
            startTime: '2023-06-18T15:49:37.301Z',
            description: 'Pending',
            endTime: '2023-06-18T15:49:37.345Z',
          },
          {
            startTime: '2023-06-18T15:49:43.454Z',
            description: 'RunningJob',
            endTime: '2023-06-18T15:50:27.172Z',
          },
          {
            startTime: '2023-06-18T15:49:43.180Z',
            description: 'PreparingJob',
            endTime: '2023-06-18T15:49:43.346Z',
          },
          {
            startTime: '2023-06-18T15:50:27.172Z',
            description: 'UpdatingJobStore',
            endTime: '2023-06-18T15:50:27.947Z',
          },
          {
            startTime: '2023-06-18T15:49:43.170Z',
            description: 'WaitingForValueStore',
            endTime: '2023-06-18T15:49:43.180Z',
          },
          {
            startTime: '2023-06-18T15:49:43.346Z',
            description: 'CallCacheReading',
            endTime: '2023-06-18T15:49:43.454Z',
          },
        ],
      },
    ],
    'main_workflow.start': [
      {
        stdout: '/Users/jthomas/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-start/execution/stdout',
        shardIndex: -1,
        ...commonWorkflowAttributes,
        end: '2023-06-18T15:50:19.945Z',
        start: '2023-06-18T15:49:37.282Z',
        stderr: '/Users/jthomas/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-start/execution/stderr',
        callRoot: '/Users/jthomas/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-start',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-06-18T15:49:43.356Z',
            description: 'CallCacheReading',
            endTime: '2023-06-18T15:49:43.456Z',
          },
          {
            startTime: '2023-06-18T15:49:37.301Z',
            description: 'Pending',
            endTime: '2023-06-18T15:49:37.345Z',
          },
          {
            startTime: '2023-06-18T15:49:37.345Z',
            description: 'RequestingExecutionToken',
            endTime: '2023-06-18T15:49:43.170Z',
          },
          {
            startTime: '2023-06-18T15:50:19.820Z',
            description: 'UpdatingJobStore',
            endTime: '2023-06-18T15:50:19.945Z',
          },
          {
            startTime: '2023-06-18T15:49:43.456Z',
            description: 'RunningJob',
            endTime: '2023-06-18T15:50:19.820Z',
          },
          {
            startTime: '2023-06-18T15:49:43.180Z',
            description: 'PreparingJob',
            endTime: '2023-06-18T15:49:43.356Z',
          },
          {
            startTime: '2023-06-18T15:49:43.170Z',
            description: 'WaitingForValueStore',
            endTime: '2023-06-18T15:49:43.180Z',
          },
        ],
      },
    ],
    'main_workflow.wf_scattering': [
      {
        shardIndex: -1,
        inputs: {},
        failures: [
          {
            causedBy: [failures, failures, failures, failures, failures],
            message: 'Workflow failed',
          },
        ],
        end: '2023-06-18T15:50:32.922Z',
        retryableFailure: false,
        executionStatus: 'Failed',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-06-18T15:49:37.291Z',
            description: 'SubWorkflowPendingState',
            endTime: '2023-06-18T15:49:37.314Z',
          },
          {
            startTime: '2023-06-18T15:49:37.314Z',
            description: 'WaitingForValueStore',
            endTime: '2023-06-18T15:49:37.332Z',
          },
          {
            startTime: '2023-06-18T15:49:37.345Z',
            description: 'SubWorkflowRunningState',
            endTime: '2023-06-18T15:50:28.385Z',
          },
          {
            startTime: '2023-06-18T15:49:37.332Z',
            description: 'SubWorkflowPreparingState',
            endTime: '2023-06-18T15:49:37.345Z',
          },
        ],
        start: '2023-06-18T15:49:37.284Z',
        subWorkflowId: '97967c22-bcc1-4946-b9c7-d4375f8b3070',
      },
    ],
  },
  outputs: {},
  workflowRoot: '/Users/jthomas/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305',
  actualWorkflowLanguage: 'WDL',
  status: 'Failed',
  failures: [
    {
      causedBy: [
        failures,
        failures,
        {
          causedBy: [failures, failures, failures, failures, failures],
          message: 'Workflow failed',
        },
      ],
      message: 'Workflow failed',
    },
  ],
  end: '2023-06-18T15:50:33.420Z',
  start: '2023-06-18T15:49:34.753Z',
  id: 'be48c79d-f8e8-4a0a-bed4-787a30a60305',
  inputs: {},
  labels: {
    'cromwell-workflow-id': 'cromwell-be48c79d-f8e8-4a0a-bed4-787a30a60305',
  },
  submission: '2023-06-18T15:49:33.770Z',
};
