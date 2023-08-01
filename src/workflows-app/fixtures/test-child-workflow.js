export const metadata = {
  workflowName: 'wf_scattering',
  rootWorkflowId: 'be48c79d-f8e8-4a0a-bed4-787a30a60305',
  calls: {
    'wf_scattering.scatteringHello': [
      {
        stdout:
          '/Users/username/cromwell/cromwell-executions/main_workflow/be48c79d-f8e8-4a0a-bed4-787a30a60305/call-wf_scattering/wf_scattering/97967c22-bcc1-4946-b9c7-d4375f8b3070/call-scatteringHello/shard-0/execution/stdout',
        shardIndex: 0,
        runtimeAttributes: {
          maxRetries: '0',
          failOnStderr: 'false',
          continueOnReturnCode: '0',
        },
        callCaching: {
          allowResultReuse: false,
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
        },
        inputs: {},
        failures: [
          {
            causedBy: [
              {
                causedBy: [
                  {
                    causedBy: [
                      {
                        causedBy: [],
                        message: 'Divide by zero error: 2 / WomInteger(0)',
                      },
                    ],
                    message: 'Error(s)',
                  },
                ],
                message: 'Failed command instantiation',
              },
            ],
            message: 'java.lang.Exception: Failed command instantiation',
          },
        ],
        backend: 'Local',
        end: '2023-06-18T15:50:27.947Z',
        start: '2023-06-18T15:49:41.465Z',
        retryableFailure: false,
        executionStatus: 'Failed',
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
        runtimeAttributes: {
          maxRetries: '0',
          failOnStderr: 'false',
          continueOnReturnCode: '0',
        },
        callCaching: {
          allowResultReuse: false,
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
        },
        inputs: {},
        failures: [
          {
            causedBy: [
              {
                causedBy: [
                  {
                    causedBy: [
                      {
                        causedBy: [],
                        message: 'Divide by zero error: 2 / WomInteger(0)',
                      },
                    ],
                    message: 'Error(s)',
                  },
                ],
                message: 'Failed command instantiation',
              },
            ],
            message: 'java.lang.Exception: Failed command instantiation',
          },
        ],
        backend: 'Local',
        end: '2023-06-18T15:50:17.965Z',
        start: '2023-06-18T15:49:41.463Z',
        retryableFailure: false,
        executionStatus: 'Failed',
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
        runtimeAttributes: {
          maxRetries: '0',
          failOnStderr: 'false',
          continueOnReturnCode: '0',
        },
        callCaching: {
          allowResultReuse: false,
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
        },
        inputs: {},
        failures: [
          {
            causedBy: [
              {
                causedBy: [
                  {
                    causedBy: [
                      {
                        causedBy: [],
                        message: 'Divide by zero error: 2 / WomInteger(0)',
                      },
                    ],
                    message: 'Error(s)',
                  },
                ],
                message: 'Failed command instantiation',
              },
            ],
            message: 'java.lang.Exception: Failed command instantiation',
          },
        ],
        backend: 'Local',
        end: '2023-06-18T15:50:21.947Z',
        start: '2023-06-18T15:49:41.464Z',
        retryableFailure: false,
        executionStatus: 'Failed',
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
        runtimeAttributes: {
          maxRetries: '0',
          failOnStderr: 'false',
          continueOnReturnCode: '0',
        },
        callCaching: {
          allowResultReuse: false,
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
        },
        inputs: {},
        failures: [
          {
            causedBy: [
              {
                causedBy: [
                  {
                    causedBy: [
                      {
                        causedBy: [],
                        message: 'Divide by zero error: 2 / WomInteger(0)',
                      },
                    ],
                    message: 'Error(s)',
                  },
                ],
                message: 'Failed command instantiation',
              },
            ],
            message: 'java.lang.Exception: Failed command instantiation',
          },
        ],
        backend: 'Local',
        end: '2023-06-18T15:50:27.948Z',
        start: '2023-06-18T15:49:41.465Z',
        retryableFailure: false,
        executionStatus: 'Failed',
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
        runtimeAttributes: {
          maxRetries: '0',
          failOnStderr: 'false',
          continueOnReturnCode: '0',
        },
        callCaching: {
          allowResultReuse: false,
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
        },
        inputs: {},
        failures: [
          {
            causedBy: [
              {
                causedBy: [
                  {
                    causedBy: [
                      {
                        causedBy: [],
                        message: 'Divide by zero error: 2 / WomInteger(0)',
                      },
                    ],
                    message: 'Error(s)',
                  },
                ],
                message: 'Failed command instantiation',
              },
            ],
            message: 'java.lang.Exception: Failed command instantiation',
          },
        ],
        backend: 'Local',
        end: '2023-06-18T15:50:25.944Z',
        start: '2023-06-18T15:49:41.464Z',
        retryableFailure: false,
        executionStatus: 'Failed',
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
