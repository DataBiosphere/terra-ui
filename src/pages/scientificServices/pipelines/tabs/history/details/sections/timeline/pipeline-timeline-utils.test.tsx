import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';

import { calculateTimelineEvents, getQcEvent, PipelineTimelineEvent } from './pipeline-timeline-utils';

const createMockPipelineRunResult = (overrides?: Partial<PipelineRunResponse>): PipelineRunResponse =>
  ({
    jobReport: {
      id: 'test-id',
      jobId: 'test-job-id',
      status: 'SUCCEEDED',
      submitted: '2026-01-01T10:00:00Z',
      completed: '2026-01-01T11:30:45Z',
    },
    pipelineRunReport: {
      quotaConsumed: 100,
      inputSizeUnits: 'samples',
    },
    errorReport: null,
    ...overrides,
  } as PipelineRunResponse);

describe('pipeline-timeline-utils', () => {
  describe('getQcEvent', () => {
    it('should return QC event with FAILED status when QC fails', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        jobReport: {
          id: 'test-id',
          status: 'FAILED',
          submitted: '2024-01-01T10:00:00Z',
          completed: '2024-01-01T10:05:00Z',
        },
        errorReport: {
          message: 'User input failed QC: your data is really bad!',
          errorCode: 400,
          causes: [],
        },
      });

      const qcEvent = getQcEvent(mockPipelineRun);

      expect(qcEvent).toBeDefined();
      expect(qcEvent?.status).toBe('FAILED');
      expect(qcEvent?.moreInfo).toBe('Input data failed QC checks');
    });

    it('should return QC event with PENDING status when pipeline is running and quota not charged', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        jobReport: {
          id: 'test-id',
          status: 'RUNNING',
          submitted: '2024-01-01T10:00:00Z',
          completed: undefined,
        },
        pipelineRunReport: {
          pipelineName: 'array_imputation',
          pipelineVersion: 2,
          toolVersion: '1.1.1',
          quotaConsumed: undefined,
          inputSizeUnits: undefined,
        },
      });

      const qcEvent = getQcEvent(mockPipelineRun);

      expect(qcEvent).toBeDefined();
      expect(qcEvent?.status).toBe('PENDING');
      expect(qcEvent?.moreInfo).toBe('Quality checks pending');
    });

    it('should return QC event with SUCCEEDED status when quota is charged', () => {
      const mockPipelineRun = createMockPipelineRunResult();

      const qcEvent = getQcEvent(mockPipelineRun);

      expect(qcEvent).toBeDefined();
      expect(qcEvent?.status).toBe('SUCCEEDED');
      expect(qcEvent?.moreInfo).toBe('Input data passed QC checks');
    });

    it('should return undefined when QC event conditions are not met', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        jobReport: {
          id: 'test-id',
          status: 'SUCCEEDED',
          submitted: '2024-01-01T10:00:00Z',
          completed: undefined,
        },
        pipelineRunReport: {
          pipelineName: 'array_imputation',
          pipelineVersion: 2,
          toolVersion: '1.1.1',
          quotaConsumed: undefined,
          inputSizeUnits: undefined,
        },
      });

      const qcEvent = getQcEvent(mockPipelineRun);

      expect(qcEvent).toBeUndefined();
    });
  });
});
