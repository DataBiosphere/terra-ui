import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';

import { getQcEvent, getQuotaEvent, getTerminalEvent } from './pipeline-timeline-utils';

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

  describe('getQuotaEvent', () => {
    it('should return Quota event with SUCCEEDED status and amount when quota is charged', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        pipelineRunReport: {
          pipelineName: 'array_imputation',
          pipelineVersion: 2,
          toolVersion: '1.1.1',
          quotaConsumed: 250,
          inputSizeUnits: 'samples',
        },
      });

      const quotaEvent = getQuotaEvent(mockPipelineRun);

      expect(quotaEvent).toBeDefined();
      expect(quotaEvent?.status).toBe('SUCCEEDED');
      expect(quotaEvent?.moreInfo).toBe('250 samples');
    });

    it('should return Quota event with CANCELLED status when pipeline fails', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        jobReport: {
          id: 'test-id',
          status: 'FAILED',
          submitted: '2024-01-01T10:00:00Z',
          completed: '2024-01-01T10:05:00Z',
        },
        pipelineRunReport: {
          pipelineName: 'array_imputation',
          pipelineVersion: 2,
          toolVersion: '1.1.1',
          quotaConsumed: undefined,
          inputSizeUnits: undefined,
        },
      });

      const quotaEvent = getQuotaEvent(mockPipelineRun);

      expect(quotaEvent).toBeDefined();
      expect(quotaEvent?.status).toBe('CANCELLED');
      expect(quotaEvent?.moreInfo).toBe('No quota charged');
    });

    it('should return Quota event with PENDING status when pipeline is running without quota', () => {
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

      const quotaEvent = getQuotaEvent(mockPipelineRun);

      expect(quotaEvent).toBeDefined();
      expect(quotaEvent?.status).toBe('PENDING');
      expect(quotaEvent?.moreInfo).toBe('Quota charges pending');
    });

    it('should return undefined when no quota conditions are met', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        jobReport: {
          id: 'test-id',
          status: 'SUCCEEDED',
          submitted: '2024-01-01T10:00:00Z',
          completed: '2024-01-01T11:30:45Z',
        },
        pipelineRunReport: {
          pipelineName: 'array_imputation',
          pipelineVersion: 2,
          toolVersion: '1.1.1',
          quotaConsumed: undefined,
          inputSizeUnits: undefined,
        },
      });

      const quotaEvent = getQuotaEvent(mockPipelineRun);

      expect(quotaEvent).toBeUndefined();
    });

    it('should handle different quota units correctly', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        pipelineRunReport: {
          pipelineName: 'array_imputation',
          pipelineVersion: 2,
          toolVersion: '1.1.1',
          quotaConsumed: 5,
          inputSizeUnits: 'other things',
        },
      });

      const quotaEvent = getQuotaEvent(mockPipelineRun);

      expect(quotaEvent).toBeDefined();
      expect(quotaEvent?.status).toBe('SUCCEEDED');
      expect(quotaEvent?.moreInfo).toBe('5 other things');
    });
  });

  describe('getTerminalEvent', () => {
    it('should return terminal event with SUCCEEDED status and label when pipeline succeeds', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        jobReport: {
          id: 'test-id',
          status: 'SUCCEEDED',
          submitted: '2024-01-01T10:00:00Z',
          completed: '2024-01-01T11:30:45Z',
        },
      });

      const terminalEvent = getTerminalEvent(mockPipelineRun);

      expect(terminalEvent).toBeDefined();
      expect(terminalEvent.label).toBe('Pipeline Succeeded');
      expect(terminalEvent.status).toBe('SUCCEEDED');
      expect(terminalEvent.timestamp).toBe('2024-01-01T11:30:45Z');
      expect(terminalEvent.moreInfo).toBeUndefined();
    });

    it('should return terminal event with FAILED status and label when pipeline fails', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        jobReport: {
          id: 'test-id',
          status: 'FAILED',
          submitted: '2024-01-01T10:00:00Z',
          completed: '2024-01-01T10:05:00Z',
        },
      });

      const terminalEvent = getTerminalEvent(mockPipelineRun);

      expect(terminalEvent).toBeDefined();
      expect(terminalEvent.label).toBe('Pipeline Failed');
      expect(terminalEvent.status).toBe('FAILED');
      expect(terminalEvent.timestamp).toBe('2024-01-01T10:05:00Z');
      expect(terminalEvent.moreInfo).toBeUndefined();
    });

    it('should return terminal event with RUNNING status and label when pipeline is running', () => {
      const mockPipelineRun = createMockPipelineRunResult({
        jobReport: {
          id: 'test-id',
          status: 'RUNNING',
          submitted: '2024-01-01T10:00:00Z',
          completed: undefined,
        },
      });

      const terminalEvent = getTerminalEvent(mockPipelineRun);

      expect(terminalEvent).toBeDefined();
      expect(terminalEvent.label).toBe('Pipeline Running');
      expect(terminalEvent.status).toBe('RUNNING');
      expect(terminalEvent.timestamp).toBeUndefined();
      expect(terminalEvent.moreInfo).toBe('This pipeline is currently running');
    });
  });
});
