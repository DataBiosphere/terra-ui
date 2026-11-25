import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import CallTable, {
  callDisplayName,
  callType,
  groupScatters,
  makeBatchJobUrl,
  scatterStatusCounts,
} from 'src/pages/workspaces/workspace/submissionHistory/CallTable';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { collapseCromwellStatus } from 'src/workflows-app/components/job-common';

describe('makeBatchJobUrl', () => {
  it('builds a GCP Batch console URL from a full Batch resource-name jobId', () => {
    const jobId = 'projects/terra-bb519a4d/locations/us-central1/jobs/job-fe6d19c1-helloworldecho-1-0f9d2497';
    expect(makeBatchJobUrl(jobId)).toBe(
      'https://console.cloud.google.com/batch/jobsDetail/regions/us-central1/jobs/job-fe6d19c1-helloworldecho-1-0f9d2497/details?project=terra-bb519a4d'
    );
  });

  it.each([
    { label: 'undefined jobId', jobId: undefined },
    { label: 'empty jobId', jobId: '' },
    { label: 'a PAPIv2 operation jobId', jobId: 'projects/terra-bb519a4d/operations/abc123' },
    { label: 'an Azure TES jobId', jobId: '117f49d5_59bbe' },
  ])('returns undefined for $label', ({ jobId }) => {
    expect(makeBatchJobUrl(jobId)).toBeUndefined();
  });
});

describe('callType', () => {
  it.each([
    { label: 'an unscattered task', call: { shardIndex: -1 }, expected: 'Task' },
    { label: 'an unscattered subworkflow', call: { shardIndex: -1, subWorkflowId: 'abc' }, expected: 'Subworkflow' },
    { label: 'a scattered task', call: { shardIndex: 0 }, expected: 'Scatter' },
    { label: 'a scattered subworkflow, e.g. a nested scatter', call: { shardIndex: 1, subWorkflowId: 'abc' }, expected: 'Scatter' },
    { label: 'a call with no shardIndex', call: {}, expected: 'Task' },
  ])('labels $label as $expected', ({ call, expected }) => {
    expect(callType(call)).toBe(expected);
  });
});

describe('callDisplayName', () => {
  it.each([
    { taskName: 'ImputationBeagle.CreateIndexForGatheredVcfContig', expected: 'CreateIndexForGatheredVcfContig' },
    { taskName: 'sub_wf_scattering.subSubworkflowHello', expected: 'subSubworkflowHello' },
    { taskName: 'ScatterAt154_14', expected: 'ScatterAt154_14' },
  ])('shows $taskName as $expected', ({ taskName, expected }) => {
    expect(callDisplayName(taskName)).toBe(expected);
  });
});

// Rows as generateCallTableData builds them
const callRow = (taskName, call) => ({
  taskName,
  type: callType(call),
  statusObj: collapseCromwellStatus(call.executionStatus),
  ...call,
});

describe('groupScatters', () => {
  const task = callRow('Wf.Task', { shardIndex: -1, executionStatus: 'Done' });
  const shard1 = callRow('Wf.Scattered', { shardIndex: 1, attempt: 1, executionStatus: 'Done' });
  const shard0 = callRow('Wf.Scattered', { shardIndex: 0, attempt: 1, executionStatus: 'Done' });
  const later = callRow('Wf.Later', { shardIndex: -1, executionStatus: 'Done' });

  it('rolls a collapsed scatter into one row where its first shard sorts', () => {
    const rows = groupScatters([task, shard1, later, shard0], []);
    expect(_.map('taskName', rows)).toEqual(['Wf.Task', 'Wf.Scattered', 'Wf.Later']);
    expect(rows[1]).toEqual({ rowKind: 'scatter', taskName: 'Wf.Scattered', type: 'Scatter', shards: [shard0, shard1] });
  });

  it('follows an expanded scatter with its shards in shard order', () => {
    const rows = groupScatters([task, shard1, later, shard0], ['Wf.Scattered']);
    expect(_.map('rowKind', rows)).toEqual([undefined, 'scatter', 'shard', 'shard', undefined]);
    expect(_.map('shardIndex', rows.slice(2, 4))).toEqual([0, 1]);
  });
});

describe('scatterStatusCounts', () => {
  it('counts shards by status, most urgent first', () => {
    const shards = [
      callRow('Wf.S', { shardIndex: 0, executionStatus: 'Done' }),
      callRow('Wf.S', { shardIndex: 1, executionStatus: 'Failed' }),
      callRow('Wf.S', { shardIndex: 2, executionStatus: 'Done' }),
    ];
    expect(_.map(({ statusObj, count }) => [statusObj.id, count], scatterStatusCounts(shards))).toEqual([
      ['failed', 1],
      ['succeeded', 2],
    ]);
  });
});

describe('CallTable scatter rows', () => {
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight') || { value: undefined };
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth') || { value: undefined };

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1200 });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  const callObjects = {
    'Wf.CountSamples': [{ shardIndex: -1, attempt: 1, executionStatus: 'Done', start: '2026-11-23T10:49:00Z', end: '2026-11-23T10:50:00Z' }],
    'Wf.Gather': [
      { shardIndex: 0, attempt: 1, executionStatus: 'Done', start: '2026-11-23T11:00:00Z', end: '2026-11-23T11:01:00Z' },
      { shardIndex: 1, attempt: 1, executionStatus: 'Failed', start: '2026-11-23T11:00:30Z', end: '2026-11-23T11:02:00Z' },
    ],
  };

  it('collapses a scatter into one row that expands to its shards', async () => {
    const user = userEvent.setup();
    render(h(CallTable, { callObjects, workflowId: 'wf-id', workflowName: 'Wf' }));

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(3); // header, CountSamples, Gather
    within(table).getByText('Gather');
    within(table).getByText('(2 shards)');
    within(table).getByText('1 Failed');
    within(table).getByText('1 Succeeded');
    expect(within(table).queryByText('Shard 0')).toBeNull();

    await user.click(screen.getByLabelText('Expand Gather shards'));
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    within(table).getByText('Shard 0');
    within(table).getByText('Shard 1');
    expect(screen.getByLabelText('Collapse Gather shards')).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByLabelText('Collapse Gather shards'));
    expect(within(table).getAllByRole('row')).toHaveLength(3);

    // The name toggles the shards too, not just the arrow
    await user.click(within(table).getByText('Gather'));
    expect(within(table).getAllByRole('row')).toHaveLength(5);
  });
});
