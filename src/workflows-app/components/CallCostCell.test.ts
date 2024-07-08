describe('CallTable functions', () => {
  it.each([
    {
      task: {
        executionStatus: 'Done',
        subWorkflowId: 'acec1c90-0871-48fe-899f-6d2b38a07196',
        callCaching: {
          hit: false,
          result: 'Cache Miss',
        },
        taskStartTime: '2024-06-17T21:19:14.6913148',
      },
      expected: undefined,
    },
    {
      task: {
        executionStatus: 'Failed',
        subWorkflowId: 'acec1c90-0871-48fe-899f-6d2b38a07196',
        callCaching: {
          hit: false,
          result: 'Cache Miss',
        },
        taskStartTime: '2024-06-17T21:19:14.6913148',
      },
      expected: true,
    },
    {
      task: {
        executionStatus: 'Done',
        subWorkflowId: 'acec1c90-0871-48fe-899f-6d2b38a07196Z',
        callCaching: {
          hit: false,
          result: 'Cache Miss',
        },
      },
      expected: true,
    },
    {
      task: {
        executionStatus: 'Running',
        subWorkflowId: 'acec1c90-0871-48fe-899f-6d2b38a07196',
        callCaching: {
          hit: false,
          result: 'Cache Miss',
        },
        taskStartTime: '2024-06-17T21:19:14.6913148Z',
      },
      expected: undefined,
    },
  ]);
});
