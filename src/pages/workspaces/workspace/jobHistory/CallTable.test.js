import { noCostData } from 'src/pages/workspaces/workspace/jobHistory/CallTable';

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
      subWorkflowId: 'acec1c90-0871-48fe-899f-6d2b38a07196',
      expected: true,
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
      subWorkflowId: '',
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
      subWorkflowId: '',
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
      subWorkflowId: undefined,
      expected: undefined,
    },
  ])('returns expected boolean given task data', ({ task, subWorkflowId, expected }) => {
    // Arrange
    const cost = noCostData(task, subWorkflowId);

    // Assert
    expect(cost).toBe(expected);
  });
});
