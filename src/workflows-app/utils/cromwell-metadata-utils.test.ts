import { getCostOfCall } from '../RunDetails';
import {
  calculateCostOfCallAttempt,
  calculateCostOfCallsArray,
  calculateTaskCost,
  findCallAttemptsByCallNameInCostGraph,
} from './cromwell-metadata-utils';

const mockCostDataWithSubworkflows = {
  calls: {
    'main_workflow.foo': [
      {
        shardIndex: -1,
        taskEndTime: '2024-07-07T15:44:36.4116250Z',
        taskStartTime: '2024-07-07T15:22:58.2754021Z',
        attempt: 1,
        vmCostUsd: '8.60',
      },
    ],
    'main_workflow.hello_and_goodbye': [
      {
        subWorkflowMetadata: {
          calls: {
            'hello_and_goodbye.goodbye': [
              {
                shardIndex: -1,
                taskEndTime: '2024-07-07T15:44:50.4587269Z',
                taskStartTime: '2024-07-07T15:23:09.1931315Z',
                attempt: 1,
                vmCostUsd: '8.60',
              },
            ],
            'hello_and_goodbye.eqality_testing': [
              {
                subWorkflowMetadata: {
                  calls: {
                    'eqality_testing.test_equality': [
                      {
                        shardIndex: -1,
                        taskEndTime: '2024-07-07T15:45:16.6315605Z',
                        taskStartTime: '2024-07-07T15:23:09.7985992Z',
                        attempt: 1,
                        vmCostUsd: '8.60',
                      },
                    ],
                    'eqality_testing.three_from_main': [
                      {
                        subWorkflowMetadata: {
                          calls: {
                            'three_from_main.four_from_main': [
                              {
                                subWorkflowMetadata: {
                                  calls: {
                                    'four_from_main.task_4_from_main': [
                                      {
                                        shardIndex: -1,
                                        taskEndTime: '2024-07-07T15:45:17.0568297Z',
                                        taskStartTime: '2024-07-07T15:23:10.5271926Z',
                                        attempt: 1,
                                        vmCostUsd: '8.60',
                                      },
                                    ],
                                  },
                                  id: 'ce978c56-cd57-4f83-afd7-e725afccbd2f',
                                },
                                attempt: 1,
                                shardIndex: -1,
                              },
                            ],
                          },
                          id: 'e88b1edc-fb38-4408-8226-2d1e4cdb8bcf',
                        },
                        attempt: 1,
                        shardIndex: -1,
                      },
                    ],
                  },
                  id: '1ab98096-884c-471d-8b83-eadfc870350b',
                },
                attempt: 1,
                shardIndex: -1,
              },
            ],
            'hello_and_goodbye.hello': [
              {
                shardIndex: -1,
                taskEndTime: '2024-07-07T15:44:50.0808064Z',
                taskStartTime: '2024-07-07T15:23:08.6016151Z',
                attempt: 1,
                vmCostUsd: '8.60',
              },
            ],
          },
          id: '840d20e9-709e-4987-8d89-bc17796755f4',
        },
        attempt: 1,
        shardIndex: -1,
      },
    ],
  },
  id: 'd92d6c92-3934-4606-8de2-7c5352104bc4',
};

// References to the tasks in the mockCostDataWithSubworkflows object
const task1 = mockCostDataWithSubworkflows.calls['main_workflow.foo'][0];
const task2 =
  mockCostDataWithSubworkflows.calls['main_workflow.hello_and_goodbye'][0].subWorkflowMetadata.calls[
    'hello_and_goodbye.goodbye'
  ][0];
const task3 =
  mockCostDataWithSubworkflows.calls['main_workflow.hello_and_goodbye'][0].subWorkflowMetadata.calls[
    'hello_and_goodbye.eqality_testing'
  ][0].subWorkflowMetadata.calls['eqality_testing.test_equality'][0];
const task4 =
  mockCostDataWithSubworkflows.calls['main_workflow.hello_and_goodbye'][0].subWorkflowMetadata.calls[
    'hello_and_goodbye.hello'
  ][0];
const task5 =
  mockCostDataWithSubworkflows.calls['main_workflow.hello_and_goodbye'][0].subWorkflowMetadata.calls[
    'hello_and_goodbye.eqality_testing'
  ][0].subWorkflowMetadata.calls['eqality_testing.three_from_main'][0].subWorkflowMetadata.calls[
    'three_from_main.four_from_main'
  ][0].subWorkflowMetadata.calls['four_from_main.task_4_from_main'][0];

const subworkflow1 = mockCostDataWithSubworkflows.calls['main_workflow.hello_and_goodbye'][0];
const subworkflow2 =
  mockCostDataWithSubworkflows.calls['main_workflow.hello_and_goodbye'][0].subWorkflowMetadata.calls[
    'hello_and_goodbye.eqality_testing'
  ][0];

const subworkflow3 =
  mockCostDataWithSubworkflows.calls['main_workflow.hello_and_goodbye'][0].subWorkflowMetadata.calls[
    'hello_and_goodbye.eqality_testing'
  ][0].subWorkflowMetadata.calls['eqality_testing.three_from_main'][0];

const mockCostDataWithScattersAndAttempts = {
  calls: {
    'randomly_fail_wf.randomly_fail_task': [
      {
        shardIndex: 0,
        taskEndTime: '2024-07-08T15:41:35.9605286Z',
        taskStartTime: '2024-07-08T15:32:46.9725705Z',
        attempt: 1,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 0,
        taskEndTime: '2024-07-08T15:43:28.5535301Z',
        taskStartTime: '2024-07-08T15:42:28.1105392Z',
        attempt: 2,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 0,
        taskEndTime: '2024-07-08T15:48:03.8450576Z',
        taskStartTime: '2024-07-08T15:47:18.9745167Z',
        attempt: 3,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 1,
        taskEndTime: '2024-07-08T15:41:45.3306725Z',
        taskStartTime: '2024-07-08T15:32:56.4690673Z',
        attempt: 1,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 1,
        taskEndTime: '2024-07-08T15:44:14.8792816Z',
        taskStartTime: '2024-07-08T15:42:28.6869121Z',
        attempt: 2,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 1,
        taskEndTime: '2024-07-08T15:47:48.0741499Z',
        taskStartTime: '2024-07-08T15:46:29.5234286Z',
        attempt: 3,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 2,
        taskEndTime: '2024-07-08T15:41:33.3386831Z',
        taskStartTime: '2024-07-08T15:32:34.6959168Z',
        attempt: 1,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 2,
        taskEndTime: '2024-07-08T15:42:49.3893200Z',
        taskStartTime: '2024-07-08T15:41:59.2345885Z',
        attempt: 2,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 3,
        taskEndTime: '2024-07-08T15:41:45.7190092Z',
        taskStartTime: '2024-07-08T15:33:04.1262365Z',
        attempt: 1,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 4,
        taskEndTime: '2024-07-08T15:41:34.2218323Z',
        taskStartTime: '2024-07-08T15:32:37.0038842Z',
        attempt: 1,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 4,
        taskEndTime: '2024-07-08T15:43:46.5878830Z',
        taskStartTime: '2024-07-08T15:42:43.4342222Z',
        attempt: 2,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 4,
        taskEndTime: '2024-07-08T15:46:23.0996632Z',
        taskStartTime: '2024-07-08T15:45:31.4874134Z',
        attempt: 3,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 4,
        taskEndTime: '2024-07-08T15:52:14.8303502Z',
        taskStartTime: '2024-07-08T15:51:27.0568794Z',
        attempt: 4,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 4,
        taskEndTime: '2024-07-08T16:01:39.3960789Z',
        taskStartTime: '2024-07-08T15:55:20.8351514Z',
        attempt: 5,
        vmCostUsd: '0.0086',
      },
      {
        shardIndex: 4,
        taskEndTime: '2024-07-08T16:06:34.6063316Z',
        taskStartTime: '2024-07-08T16:05:38.1958582Z',
        attempt: 6,
        vmCostUsd: '0.0086',
      },
    ],
  },
  id: '44fb07e0-3220-4af6-a83e-c114d89ac8b2',
};

describe('Cromwell Metadata Utils - Cost Calculation Unit Tests', () => {
  it('correctly calculates the cost of a top level task', () => {
    const endTime = Date.parse(mockCostDataWithSubworkflows.calls['main_workflow.foo'][0].taskEndTime);
    const vmCostDouble = parseFloat(mockCostDataWithSubworkflows.calls['main_workflow.foo'][0].vmCostUsd);
    const startTime = Date.parse(mockCostDataWithSubworkflows.calls['main_workflow.foo'][0].taskStartTime);
    const elapsedTime = endTime - startTime;
    const expectedCost = parseFloat(((elapsedTime / 3600000) * vmCostDouble).toFixed(2)); // 1 hour = 3600000 ms

    // Sanity check that our calculateTaskCost function is indeed VM cost * time
    expect(
      calculateTaskCost(
        mockCostDataWithSubworkflows.calls['main_workflow.foo'][0].taskStartTime,
        mockCostDataWithSubworkflows.calls['main_workflow.foo'][0].vmCostUsd,
        mockCostDataWithSubworkflows.calls['main_workflow.foo'][0].taskEndTime
      )
    ).toEqual(expectedCost);

    // Check that our getCostOfCall function is returning the same value
    expect(calculateCostOfCallAttempt(mockCostDataWithSubworkflows.calls['main_workflow.foo'][0])).toEqual(
      expectedCost
    );

    // Check that the RunDetails callback function can find and return the same cost.
    expect(getCostOfCall(mockCostDataWithSubworkflows, 'main_workflow.foo', 1, -1)).toEqual(expectedCost);
  });

  it('correctly calculates the cost of a subworkflow with nested subworkflows', () => {
    const expected = 12.56;
    expect(
      calculateCostOfCallAttempt(mockCostDataWithSubworkflows.calls['main_workflow.hello_and_goodbye'][0])
    ).toBeCloseTo(expected);
  });

  it('correctly calculates the cost of a workflow to be the sum of its tasks', () => {
    let expectedCost = 0;
    for (const task of [task1, task2, task3, task4, task5]) {
      expectedCost += calculateCostOfCallAttempt(task);
    }
    expect(calculateCostOfCallsArray(mockCostDataWithSubworkflows.calls)).toBeCloseTo(expectedCost);
  });

  it('can find task and subworkflow attempts arrays by name', () => {
    expect(findCallAttemptsByCallNameInCostGraph('main_workflow.foo', mockCostDataWithSubworkflows)[0]).toEqual(task1);
    expect(findCallAttemptsByCallNameInCostGraph('hello_and_goodbye.goodbye', mockCostDataWithSubworkflows)[0]).toEqual(
      task2
    );
    expect(
      findCallAttemptsByCallNameInCostGraph('eqality_testing.test_equality', mockCostDataWithSubworkflows)[0]
    ).toEqual(task3);
    expect(findCallAttemptsByCallNameInCostGraph('hello_and_goodbye.hello', mockCostDataWithSubworkflows)[0]).toEqual(
      task4
    );
    expect(
      findCallAttemptsByCallNameInCostGraph('four_from_main.task_4_from_main', mockCostDataWithSubworkflows)[0]
    ).toEqual(task5);

    expect(
      findCallAttemptsByCallNameInCostGraph('main_workflow.hello_and_goodbye', mockCostDataWithSubworkflows)[0]
    ).toEqual(subworkflow1);

    expect(
      findCallAttemptsByCallNameInCostGraph('hello_and_goodbye.eqality_testing', mockCostDataWithSubworkflows)[0]
    ).toEqual(subworkflow2);

    expect(
      findCallAttemptsByCallNameInCostGraph('eqality_testing.three_from_main', mockCostDataWithSubworkflows)[0]
    ).toEqual(subworkflow3);
  });

  it('correctly calculates the cost of a task with multiple attempts and shards', () => {
    const expected1 = calculateCostOfCallAttempt(
      mockCostDataWithScattersAndAttempts.calls['randomly_fail_wf.randomly_fail_task'][0]
    );
    const expected2 = calculateCostOfCallAttempt(
      mockCostDataWithScattersAndAttempts.calls['randomly_fail_wf.randomly_fail_task'][3]
    );
    const expected3 = calculateCostOfCallAttempt(
      mockCostDataWithScattersAndAttempts.calls['randomly_fail_wf.randomly_fail_task'][5]
    );
    expect(getCostOfCall(mockCostDataWithScattersAndAttempts, 'randomly_fail_wf.randomly_fail_task', 1, 0)).toBeCloseTo(
      expected1
    );
    expect(getCostOfCall(mockCostDataWithScattersAndAttempts, 'randomly_fail_wf.randomly_fail_task', 1, 1)).toBeCloseTo(
      expected2
    );
    expect(getCostOfCall(mockCostDataWithScattersAndAttempts, 'randomly_fail_wf.randomly_fail_task', 3, 1)).toBeCloseTo(
      expected3
    );
  });
});
