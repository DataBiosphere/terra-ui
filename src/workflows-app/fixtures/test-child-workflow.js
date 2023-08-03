import { commonWorkflowAttributes } from 'src/workflows-app/fixtures/failed-tasks';

export const metadata = {
  workflowName: 'wf_scattering',
  rootWorkflowId: 'be48c79d-f8e8-4a0a-bed4-787a30a60305',
  calls: {
    'wf_scattering.scatteringHello': [
      {
        stdout:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-0/execution/stdout',
        shardIndex: 0,
        ...commonWorkflowAttributes,
        end: '2023-06-18T15:50:27.947Z',
        start: '2023-06-18T15:49:41.465Z',
        stderr:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-0/execution/stderr',
        callRoot:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-0',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-06-18T15:50:27.032Z',
            description: 'UpdatingJobStore',
            endTime: '2023-06-18T15:50:27.947Z',
          },
          {
            startTime: '2023-06-18T15:49:41.465Z',
            description: 'Pending',
            endTime: '2023-06-18T15:49:41.466Z',
          },
          {
            startTime: '2023-06-18T15:49:43.347Z',
            description: 'CallCacheReading',
            endTime: '2023-06-18T15:49:43.456Z',
          },
          {
            startTime: '2023-06-18T15:49:43.180Z',
            description: 'PreparingJob',
            endTime: '2023-06-18T15:49:43.347Z',
          },
          {
            startTime: '2023-06-18T15:49:43.170Z',
            description: 'WaitingForValueStore',
            endTime: '2023-06-18T15:49:43.180Z',
          },
          {
            startTime: '2023-06-18T15:49:41.466Z',
            description: 'RequestingExecutionToken',
            endTime: '2023-06-18T15:49:43.170Z',
          },
          {
            startTime: '2023-06-18T15:49:43.456Z',
            description: 'RunningJob',
            endTime: '2023-06-18T15:50:27.032Z',
          },
        ],
      },
      {
        stdout:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-1/execution/stdout',
        shardIndex: 1,
        ...commonWorkflowAttributes,
        end: '2023-06-18T15:50:17.965Z',
        start: '2023-06-18T15:49:41.463Z',
        stderr:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-1/execution/stderr',
        callRoot:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-1',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-06-18T15:49:43.180Z',
            description: 'PreparingJob',
            endTime: '2023-06-18T15:49:43.346Z',
          },
          {
            startTime: '2023-06-18T15:49:43.170Z',
            description: 'WaitingForValueStore',
            endTime: '2023-06-18T15:49:43.180Z',
          },
          {
            startTime: '2023-06-18T15:50:17.367Z',
            description: 'UpdatingJobStore',
            endTime: '2023-06-18T15:50:17.967Z',
          },
          {
            startTime: '2023-06-18T15:49:41.463Z',
            description: 'Pending',
            endTime: '2023-06-18T15:49:41.464Z',
          },
          {
            startTime: '2023-06-18T15:49:41.464Z',
            description: 'RequestingExecutionToken',
            endTime: '2023-06-18T15:49:43.170Z',
          },
          {
            startTime: '2023-06-18T15:49:43.346Z',
            description: 'CallCacheReading',
            endTime: '2023-06-18T15:49:43.456Z',
          },
          {
            startTime: '2023-06-18T15:49:43.456Z',
            description: 'RunningJob',
            endTime: '2023-06-18T15:50:17.367Z',
          },
        ],
      },
      {
        stdout:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-2/execution/stdout',
        shardIndex: 2,
        ...commonWorkflowAttributes,
        end: '2023-06-18T15:50:21.947Z',
        start: '2023-06-18T15:49:41.464Z',
        stderr:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-2/execution/stderr',
        callRoot:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-2',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-06-18T15:49:43.455Z',
            description: 'RunningJob',
            endTime: '2023-06-18T15:50:20.982Z',
          },
          {
            startTime: '2023-06-18T15:49:43.170Z',
            description: 'WaitingForValueStore',
            endTime: '2023-06-18T15:49:43.180Z',
          },
          {
            startTime: '2023-06-18T15:49:41.465Z',
            description: 'RequestingExecutionToken',
            endTime: '2023-06-18T15:49:43.170Z',
          },
          {
            startTime: '2023-06-18T15:49:41.464Z',
            description: 'Pending',
            endTime: '2023-06-18T15:49:41.465Z',
          },
          {
            startTime: '2023-06-18T15:49:43.180Z',
            description: 'PreparingJob',
            endTime: '2023-06-18T15:49:43.346Z',
          },
          {
            startTime: '2023-06-18T15:50:20.982Z',
            description: 'UpdatingJobStore',
            endTime: '2023-06-18T15:50:21.946Z',
          },
          {
            startTime: '2023-06-18T15:49:43.346Z',
            description: 'CallCacheReading',
            endTime: '2023-06-18T15:49:43.455Z',
          },
        ],
      },
    ],
    'wf_scattering.scatteringGoodbye': [
      {
        stdout:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringGoodbye/shard-0/execution/stdout',
        shardIndex: 0,
        ...commonWorkflowAttributes,
        end: '2023-06-18T15:50:27.948Z',
        start: '2023-06-18T15:49:41.465Z',
        stderr:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringGoodbye/shard-0/execution/stderr',
        callRoot:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringGoodbye/shard-0',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-06-18T15:49:43.180Z',
            description: 'PreparingJob',
            endTime: '2023-06-18T15:49:43.346Z',
          },
          {
            startTime: '2023-06-18T15:49:41.465Z',
            description: 'RequestingExecutionToken',
            endTime: '2023-06-18T15:49:43.170Z',
          },
          {
            startTime: '2023-06-18T15:49:43.170Z',
            description: 'WaitingForValueStore',
            endTime: '2023-06-18T15:49:43.180Z',
          },
          {
            startTime: '2023-06-18T15:49:43.346Z',
            description: 'CallCacheReading',
            endTime: '2023-06-18T15:49:43.455Z',
          },
          {
            startTime: '2023-06-18T15:49:43.455Z',
            description: 'RunningJob',
            endTime: '2023-06-18T15:50:27.802Z',
          },
          {
            startTime: '2023-06-18T15:50:27.802Z',
            description: 'UpdatingJobStore',
            endTime: '2023-06-18T15:50:27.947Z',
          },
          {
            startTime: '2023-06-18T15:49:41.465Z',
            description: 'Pending',
            endTime: '2023-06-18T15:49:41.465Z',
          },
        ],
      },
      {
        stdout:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringGoodbye/shard-1/execution/stdout',
        shardIndex: 1,
        ...commonWorkflowAttributes,
        end: '2023-06-18T15:50:25.944Z',
        start: '2023-06-18T15:49:41.464Z',
        stderr:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringGoodbye/shard-1/execution/stderr',
        callRoot:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringGoodbye/shard-1',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-06-18T15:49:43.180Z',
            description: 'PreparingJob',
            endTime: '2023-06-18T15:49:43.376Z',
          },
          {
            startTime: '2023-06-18T15:49:41.464Z',
            description: 'Pending',
            endTime: '2023-06-18T15:49:41.464Z',
          },
          {
            startTime: '2023-06-18T15:49:43.454Z',
            description: 'RunningJob',
            endTime: '2023-06-18T15:50:25.051Z',
          },
          {
            startTime: '2023-06-18T15:49:43.376Z',
            description: 'CallCacheReading',
            endTime: '2023-06-18T15:49:43.454Z',
          },
          {
            startTime: '2023-06-18T15:50:25.051Z',
            description: 'UpdatingJobStore',
            endTime: '2023-06-18T15:50:25.944Z',
          },
          {
            startTime: '2023-06-18T15:49:43.170Z',
            description: 'WaitingForValueStore',
            endTime: '2023-06-18T15:49:43.180Z',
          },
          {
            startTime: '2023-06-18T15:49:41.464Z',
            description: 'RequestingExecutionToken',
            endTime: '2023-06-18T15:49:43.170Z',
          },
        ],
      },
    ],
  },
  workflowRoot: '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305',
  status: 'Failed',
  parentWorkflowId: 'be48c79d-f8e8-4a0a-bed4-787a30a60305',
  end: '2023-06-18T15:50:28.385Z',
  start: '2023-06-18T15:49:37.332Z',
  id: '97967c22-bcc1-4946-b9c7-d4375f8b3070',
  inputs: {},
};
