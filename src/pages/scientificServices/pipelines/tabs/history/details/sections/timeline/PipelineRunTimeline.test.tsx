import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';

import { calculatePipelineRunDuration } from './PipelineRunTimeline';

describe('PipelineRunTimeline', () => {
  describe('calculatePipelineRunDuration', () => {
    it('should return N/A when completed timestamp is missing', () => {
      const mockPipelineRun = {
        jobReport: {
          id: 'test-id',
          status: 'RUNNING',
          submitted: '2024-01-01T10:00:00Z',
          completed: undefined,
        },
      } as PipelineRunResponse;

      const duration = calculatePipelineRunDuration(mockPipelineRun);

      expect(duration).toBe('N/A');
    });

    it('should format duration with hours, minutes, and seconds when duration is over 1 hour', () => {
      const mockPipelineRun = {
        jobReport: {
          id: 'test-id',
          status: 'SUCCEEDED',
          submitted: '2024-01-01T10:00:00Z',
          completed: '2024-01-01T11:30:45Z',
        },
      } as PipelineRunResponse;

      const duration = calculatePipelineRunDuration(mockPipelineRun);

      expect(duration).toBe('1h 30m 45s');
    });

    it('should format duration with only minutes and seconds when duration is under 1 hour', () => {
      const mockPipelineRun = {
        jobReport: {
          id: 'test-id',
          status: 'SUCCEEDED',
          submitted: '2024-01-01T10:00:00Z',
          completed: '2024-01-01T10:15:30Z',
        },
      } as PipelineRunResponse;

      const duration = calculatePipelineRunDuration(mockPipelineRun);

      expect(duration).toBe('15m 30s');
    });

    it('should handle duration less than 1 minute', () => {
      const mockPipelineRun = {
        jobReport: {
          id: 'test-id',
          status: 'SUCCEEDED',
          submitted: '2024-01-01T10:00:00Z',
          completed: '2024-01-01T10:00:45Z',
        },
      } as PipelineRunResponse;

      const duration = calculatePipelineRunDuration(mockPipelineRun);

      expect(duration).toBe('0m 45s');
    });
  });
});
