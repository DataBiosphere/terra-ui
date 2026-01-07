import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import {
  getPipelineStatusColor,
  getPipelineStatusIcon,
} from 'src/pages/scientificServices/pipelines/utils/pipeline-style-utils';

export interface TimelineEvent {
  label: string;
  moreInfo?: string;
  status: string;
  timestamp?: string;
}

interface PipelineRunTimelineEventProps {
  event: TimelineEvent;
  isLast: boolean;
}

export const PipelineRunTimelineEvent = ({ event, isLast }: PipelineRunTimelineEventProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          marginRight: '1rem',
        }}
      >
        {getTimelineEventStatusIcon(event.status)}
      </div>

      <div
        style={{
          flex: 1,
          padding: '0.75rem',
          border: '1px solid #d7d9dc',
          backgroundColor: 'white',
          borderRadius: '4px',
          minHeight: '4rem',
          marginBottom: isLast ? 0 : '0.5rem',
          position: 'relative',
        }}
      >
        {!isLast && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '3px',
              height: '1rem',
              backgroundColor: '#d7d9dc',
            }}
          />
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontWeight: 'bold', color: colors.dark() }}>{event.label}</div>
          {event.timestamp && (
            <div style={{ color: colors.dark(0.9), fontStyle: 'italic' }}>
              {new Date(event.timestamp).toLocaleString()}
            </div>
          )}
          {event.moreInfo && <div style={{ color: colors.dark(0.9), fontStyle: 'italic' }}>{event.moreInfo}</div>}
        </div>
      </div>
    </div>
  );
};

// While we don't have precise insight into which steps have actually completed, we can infer based on a few things:
// If an error message indicates QC failure, we know QC checks failed.
// If quota has been charged, we know the pipeline progressed past QC checks.
const getQcStatusAndMessage = (pipelineRunResult: PipelineRunResponse): { status: string; message?: string } => {
  const qcFailed = pipelineRunResult.errorReport?.message?.includes('failed QC');
  const pipelineRunning = pipelineRunResult.jobReport.status === 'RUNNING';
  const quotaCharged = !!pipelineRunResult.pipelineRunReport.quotaConsumed;

  if (qcFailed) {
    return { status: 'FAILED', message: 'Input data failed QC checks' };
  }
  if (pipelineRunning && !quotaCharged) {
    return { status: 'PENDING', message: 'Quality checks pending' };
  }
  if (quotaCharged || pipelineRunResult.jobReport.completed) {
    return { status: 'SUCCEEDED', message: 'Input data passed QC checks' };
  }
  return { status: 'SUCCEEDED', message: undefined };
};

const getQuotaStatusAndMessage = (pipelineRunResult: PipelineRunResponse): { status: string; message?: string } => {
  const quotaCharged = !!pipelineRunResult.pipelineRunReport.quotaConsumed;
  const pipelineFailed = pipelineRunResult.jobReport.status === 'FAILED';
  const pipelineRunning = pipelineRunResult.jobReport.status === 'RUNNING';

  if (quotaCharged) {
    return {
      status: 'SUCCEEDED',
      message: `${pipelineRunResult.pipelineRunReport.quotaConsumed} ${pipelineRunResult.pipelineRunReport.inputSizeUnits}`,
    };
  }
  if (pipelineFailed) {
    return { status: 'CANCELLED', message: 'No quota charged' };
  }
  if (pipelineRunning) {
    return { status: 'PENDING', message: 'Quota charges pending' };
  }
  return { status: 'SUCCEEDED', message: undefined };
};

const getTerminalEventLabel = (pipelineRunResult: PipelineRunResponse): string => {
  if (pipelineRunResult.jobReport.status === 'SUCCEEDED') {
    return 'Pipeline Succeeded';
  }
  if (pipelineRunResult.jobReport.status === 'FAILED') {
    return 'Pipeline Failed';
  }
  return 'Running';
};

export const calculateTimelineEvents = (pipelineRunResult: PipelineRunResponse): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  events.push({
    label: 'Submitted',
    status: pipelineRunResult.jobReport.submitted ? 'SUCCEEDED' : 'PENDING',
    timestamp: pipelineRunResult.jobReport.submitted,
  });

  const qcStatusAndMessage = getQcStatusAndMessage(pipelineRunResult);
  events.push({
    label: 'Quality Checks',
    status: qcStatusAndMessage.status,
    moreInfo: qcStatusAndMessage.message,
  });

  const quotaStatusAndMessage = getQuotaStatusAndMessage(pipelineRunResult);
  events.push({
    label: 'Quota Charged',
    status: quotaStatusAndMessage.status,
    moreInfo: quotaStatusAndMessage.message,
  });

  const pipelineRunning = pipelineRunResult.jobReport.status === 'RUNNING';
  events.push({
    label: getTerminalEventLabel(pipelineRunResult),
    timestamp: pipelineRunResult.jobReport.completed,
    status: pipelineRunResult.jobReport.status,
    moreInfo: pipelineRunning ? 'This pipeline is currently running' : undefined,
  });

  return events;
};

const getTimelineEventStatusIcon = (status: string) => {
  if (status === 'CANCELLED') {
    return <Icon icon='ban' size={20} style={{ color: colors.dark(0.6) }} />;
  }
  if (status === 'PENDING') {
    return <Icon icon='circle' size={20} style={{ color: colors.dark(0.6) }} />;
  }
  if (status === 'FAILED') {
    return <Icon icon='error-standard' size={20} style={{ color: getPipelineStatusColor(status) }} />;
  }
  return getPipelineStatusIcon(status, 20);
};

export const calculateRunDuration = (pipelineRunResult: PipelineRunResponse): string => {
  if (!pipelineRunResult.jobReport.submitted || !pipelineRunResult.jobReport.completed) {
    return 'N/A';
  }

  const durationMs =
    new Date(pipelineRunResult.jobReport.completed).getTime() -
    new Date(pipelineRunResult.jobReport.submitted).getTime();

  if (durationMs === 0) {
    return 'In progress';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};
