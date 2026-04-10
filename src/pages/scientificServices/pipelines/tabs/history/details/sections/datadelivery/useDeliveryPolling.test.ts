import { renderHook } from '@testing-library/react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { DataDeliveryReport, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { asMockedFn, partial } from 'src/testing/test-utils';

import { useDeliveryPolling } from './useDeliveryPolling';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');

const mockJobId = 'test-job-id';
const runningReport: DataDeliveryReport = { status: 'RUNNING', destination: 'gs://bucket/path' };
const succeededReport: DataDeliveryReport = { status: 'SUCCEEDED', destination: 'gs://bucket/path' };

const makePipelineRunResponse = (dataDeliveryReport: DataDeliveryReport): PipelineRunResponse => ({
  jobReport: { id: mockJobId, status: 'SUCCEEDED', submitted: '2025-01-01T00:00:00Z' },
  pipelineRunReport: {
    pipelineName: 'test-pipeline',
    pipelineVersion: 1,
    toolVersion: '1.0.0',
    dataDeliveryReport,
  },
});

describe('useDeliveryPolling', () => {
  let mockGetPipelineRunResult: jest.Mock;
  let mockOnUpdate: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockGetPipelineRunResult = jest.fn().mockResolvedValue(makePipelineRunResponse(runningReport));
    mockOnUpdate = jest.fn();
    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({ getPipelineRunResult: mockGetPipelineRunResult })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe.each([
    ['NOT_STARTED', 'NOT_STARTED' as const],
    ['SUCCEEDED', 'SUCCEEDED' as const],
    ['FAILED', 'FAILED' as const],
    ['EXPIRED', 'EXPIRED' as const],
  ])('when status is %s', (_, status) => {
    it('does not poll', () => {
      renderHook(() => useDeliveryPolling({ jobId: mockJobId, status, onUpdate: mockOnUpdate }));
      jest.runAllTimers();
      expect(mockGetPipelineRunResult).not.toHaveBeenCalled();
    });
  });

  describe('when status is RUNNING', () => {
    it('schedules the first poll after 10s', () => {
      renderHook(() => useDeliveryPolling({ jobId: mockJobId, status: 'RUNNING', onUpdate: mockOnUpdate }));
      expect(mockGetPipelineRunResult).not.toHaveBeenCalled();
      jest.advanceTimersByTime(10_000);
      expect(mockGetPipelineRunResult).toHaveBeenCalledTimes(1);
    });

    it('stops polling when the report transitions to a terminal status', async () => {
      mockGetPipelineRunResult.mockResolvedValue(makePipelineRunResponse(succeededReport));

      renderHook(() => useDeliveryPolling({ jobId: mockJobId, status: 'RUNNING', onUpdate: mockOnUpdate }));
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
      expect(mockGetPipelineRunResult).toHaveBeenCalledTimes(1);

      // No further polls should be scheduled
      jest.advanceTimersByTime(120_000);
      await Promise.resolve();
      expect(mockGetPipelineRunResult).toHaveBeenCalledTimes(1);
    });

    it('cancels the pending timeout on unmount', async () => {
      const { unmount } = renderHook(() =>
        useDeliveryPolling({ jobId: mockJobId, status: 'RUNNING', onUpdate: mockOnUpdate })
      );
      unmount();
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
      expect(mockGetPipelineRunResult).not.toHaveBeenCalled();
    });
  });
});
