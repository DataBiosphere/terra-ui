const runtimeAttributes = {
  failOnStderr: 'false',
  continueOnReturnCode: '0',
  maxRetries: '0',
};

const cachingMiss = {
  allowResultReuse: true,
  hashes: {
    'output count': 'C4CA4238A0B923820DCC509A6F75849B',
    'runtime attribute': {
      docker: 'N/A',
      continueOnReturnCode: 'CFCD208495D565EF66E7DFF9F98764DA',
      failOnStderr: '68934A3E9455FA72420237EB05902327',
    },
    'output expression': {
      'String out': '0183144CF6617D5341681C6B2F756046',
    },
    'input count': 'CFCD208495D565EF66E7DFF9F98764DA',
    'backend name': '509820290D57F333403F490DDE7316F4',
    'command template': 'E80AE16736B864DC65CEA153382F11F7',
  },
  effectiveCallCachingMode: 'ReadAndWriteCache',
  hit: false,
  result: 'Cache Miss',
};

export const failures = [
  {
    message: 'java.lang.Exception: Failed command instantiation',
    causedBy: [
      {
        message: 'Failed command instantiation',
        causedBy: [
          {
            message: 'Error(s)',
            causedBy: [
              {
                message: 'Divide by zero error: 2 / WomInteger(0)',
                causedBy: [],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const commonWorkflowAttributes = {
  runtimeAttributes,
  callCaching: cachingMiss,
  inputs: {},
  failures,
  backend: 'Local',
  retryableFailure: false,
  executionStatus: 'Failed',
};

export const failedTasks = {
  'a7087cc0-961e-41f9-98c9-93f980fe73a2': {
    calls: {
      'sub_wf_scattering.subSubworkflowHello': [
        {
          stdout:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-sub_wf_scattering/sub_wf_scattering/e4fbfe56-8beb-41e0-9202-03f947b93fac/call-subSubworkflowHello/execution/stdout',
          shardIndex: -1,
          ...commonWorkflowAttributes,
          end: '2023-07-11T11:33:09.185Z',
          start: '2023-07-11T11:32:22.645Z',
          stderr:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-sub_wf_scattering/sub_wf_scattering/e4fbfe56-8beb-41e0-9202-03f947b93fac/call-subSubworkflowHello/execution/stderr',
          callRoot:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-sub_wf_scattering/sub_wf_scattering/e4fbfe56-8beb-41e0-9202-03f947b93fac/call-subSubworkflowHello',
          attempt: 1,
          executionEvents: [
            {
              endTime: '2023-07-11T11:32:28.405Z',
              description: 'WaitingForValueStore',
              startTime: '2023-07-11T11:32:28.395Z',
            },
            {
              endTime: '2023-07-11T11:32:28.745Z',
              description: 'CallCacheReading',
              startTime: '2023-07-11T11:32:28.593Z',
            },
            {
              endTime: '2023-07-11T11:32:28.395Z',
              description: 'RequestingExecutionToken',
              startTime: '2023-07-11T11:32:22.646Z',
            },
            {
              endTime: '2023-07-11T11:32:28.593Z',
              description: 'PreparingJob',
              startTime: '2023-07-11T11:32:28.405Z',
            },
            {
              endTime: '2023-07-11T11:32:22.646Z',
              description: 'Pending',
              startTime: '2023-07-11T11:32:22.645Z',
            },
            {
              endTime: '2023-07-11T11:33:09.132Z',
              description: 'RunningJob',
              startTime: '2023-07-11T11:32:28.745Z',
            },
            {
              endTime: '2023-07-11T11:33:09.186Z',
              description: 'UpdatingJobStore',
              startTime: '2023-07-11T11:33:09.132Z',
            },
          ],
        },
      ],
      'wf_scattering.scatteringGoodbye': [
        {
          stdout:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-scatteringGoodbye/shard-1/execution/stdout',
          shardIndex: 1,
          ...commonWorkflowAttributes,
          end: '2023-07-11T11:33:13.183Z',
          start: '2023-07-11T11:32:24.706Z',
          stderr:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-scatteringGoodbye/shard-1/execution/stderr',
          callRoot:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-scatteringGoodbye/shard-1',
          attempt: 1,
          executionEvents: [
            {
              endTime: '2023-07-11T11:33:13.183Z',
              description: 'UpdatingJobStore',
              startTime: '2023-07-11T11:33:12.403Z',
            },
            {
              endTime: '2023-07-11T11:32:28.405Z',
              description: 'WaitingForValueStore',
              startTime: '2023-07-11T11:32:28.395Z',
            },
            {
              endTime: '2023-07-11T11:32:28.395Z',
              description: 'RequestingExecutionToken',
              startTime: '2023-07-11T11:32:24.706Z',
            },
            {
              endTime: '2023-07-11T11:32:28.745Z',
              description: 'CallCacheReading',
              startTime: '2023-07-11T11:32:28.693Z',
            },
            {
              endTime: '2023-07-11T11:33:12.403Z',
              description: 'RunningJob',
              startTime: '2023-07-11T11:32:28.745Z',
            },
            {
              endTime: '2023-07-11T11:32:24.706Z',
              description: 'Pending',
              startTime: '2023-07-11T11:32:24.706Z',
            },
            {
              endTime: '2023-07-11T11:32:28.693Z',
              description: 'PreparingJob',
              startTime: '2023-07-11T11:32:28.405Z',
            },
          ],
        },
      ],
      'sub_wf_scattering.subSubworkflowGoodbye': [
        {
          stdout:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-sub_wf_scattering/sub_wf_scattering/e4fbfe56-8beb-41e0-9202-03f947b93fac/call-subSubworkflowGoodbye/shard-2/execution/stdout',
          shardIndex: 2,
          ...commonWorkflowAttributes,
          end: '2023-07-11T11:33:14.187Z',
          start: '2023-07-11T11:32:25.706Z',
          stderr:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-sub_wf_scattering/sub_wf_scattering/e4fbfe56-8beb-41e0-9202-03f947b93fac/call-subSubworkflowGoodbye/shard-2/execution/stderr',
          callRoot:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-sub_wf_scattering/sub_wf_scattering/e4fbfe56-8beb-41e0-9202-03f947b93fac/call-subSubworkflowGoodbye/shard-2',
          attempt: 1,
          executionEvents: [
            {
              endTime: '2023-07-11T11:32:28.629Z',
              description: 'PreparingJob',
              startTime: '2023-07-11T11:32:28.405Z',
            },
            {
              endTime: '2023-07-11T11:32:28.405Z',
              description: 'WaitingForValueStore',
              startTime: '2023-07-11T11:32:28.395Z',
            },
            {
              endTime: '2023-07-11T11:32:28.395Z',
              description: 'RequestingExecutionToken',
              startTime: '2023-07-11T11:32:25.707Z',
            },
            {
              endTime: '2023-07-11T11:32:28.745Z',
              description: 'CallCacheReading',
              startTime: '2023-07-11T11:32:28.629Z',
            },
            {
              endTime: '2023-07-11T11:33:14.187Z',
              description: 'UpdatingJobStore',
              startTime: '2023-07-11T11:33:13.883Z',
            },
            {
              endTime: '2023-07-11T11:33:13.883Z',
              description: 'RunningJob',
              startTime: '2023-07-11T11:32:28.745Z',
            },
            {
              endTime: '2023-07-11T11:32:25.707Z',
              description: 'Pending',
              startTime: '2023-07-11T11:32:25.706Z',
            },
          ],
        },
      ],
      'wf_scattering.scatteringHello': [
        {
          stdout:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-scatteringHello/shard-2/execution/stdout',
          shardIndex: 2,
          ...commonWorkflowAttributes,
          end: '2023-07-11T11:33:15.187Z',
          start: '2023-07-11T11:32:24.705Z',
          stderr:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-scatteringHello/shard-2/execution/stderr',
          callRoot:
            '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-wf_scattering/wf_scattering/d9bd552f-5887-43b3-903c-099327d30229/call-scatteringHello/shard-2',
          attempt: 1,
          executionEvents: [
            {
              endTime: '2023-07-11T11:32:28.395Z',
              description: 'RequestingExecutionToken',
              startTime: '2023-07-11T11:32:24.706Z',
            },
            {
              endTime: '2023-07-11T11:32:24.706Z',
              description: 'Pending',
              startTime: '2023-07-11T11:32:24.706Z',
            },
            {
              endTime: '2023-07-11T11:33:14.823Z',
              description: 'RunningJob',
              startTime: '2023-07-11T11:32:28.746Z',
            },
            {
              endTime: '2023-07-11T11:32:28.405Z',
              description: 'WaitingForValueStore',
              startTime: '2023-07-11T11:32:28.395Z',
            },
            {
              endTime: '2023-07-11T11:32:28.746Z',
              description: 'CallCacheReading',
              startTime: '2023-07-11T11:32:28.593Z',
            },
            {
              endTime: '2023-07-11T11:33:15.187Z',
              description: 'UpdatingJobStore',
              startTime: '2023-07-11T11:33:14.823Z',
            },
            {
              endTime: '2023-07-11T11:32:28.593Z',
              description: 'PreparingJob',
              startTime: '2023-07-11T11:32:28.405Z',
            },
          ],
        },
      ],
      'main_workflow.done': [
        {
          stdout: '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-done/execution/stdout',
          shardIndex: -1,
          ...commonWorkflowAttributes,
          end: '2023-07-11T11:33:09.185Z',
          start: '2023-07-11T11:32:20.512Z',
          stderr: '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-done/execution/stderr',
          callRoot: '/folderName/cromwell/cromwell-executions/main_workflow/a7087cc0-961e-41f9-98c9-93f980fe73a2/call-done',
          attempt: 1,
          executionEvents: [
            {
              endTime: '2023-07-11T11:33:08.763Z',
              description: 'RunningJob',
              startTime: '2023-07-11T11:32:28.745Z',
            },
            {
              endTime: '2023-07-11T11:32:28.745Z',
              description: 'CallCacheReading',
              startTime: '2023-07-11T11:32:28.672Z',
            },
            {
              endTime: '2023-07-11T11:32:28.405Z',
              description: 'WaitingForValueStore',
              startTime: '2023-07-11T11:32:28.395Z',
            },
            {
              endTime: '2023-07-11T11:32:28.672Z',
              description: 'PreparingJob',
              startTime: '2023-07-11T11:32:28.405Z',
            },
            {
              endTime: '2023-07-11T11:32:20.579Z',
              description: 'Pending',
              startTime: '2023-07-11T11:32:20.539Z',
            },
            {
              endTime: '2023-07-11T11:32:28.395Z',
              description: 'RequestingExecutionToken',
              startTime: '2023-07-11T11:32:20.579Z',
            },
            {
              endTime: '2023-07-11T11:33:09.186Z',
              description: 'UpdatingJobStore',
              startTime: '2023-07-11T11:33:08.763Z',
            },
          ],
        },
      ],
    },
  },
};
