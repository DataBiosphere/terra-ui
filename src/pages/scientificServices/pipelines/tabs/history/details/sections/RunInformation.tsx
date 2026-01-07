import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import {
  getPipelineStatusColor,
  getPipelineStatusIcon,
} from 'src/pages/scientificServices/pipelines/utils/pipeline-style-utils';

interface JobTimelineProps {
  pipelineRunResult: PipelineRunResponse;
}

export const RunInformation = ({ pipelineRunResult }: JobTimelineProps) => {
  const calculateDuration = (pipelineRunResult: PipelineRunResponse) => {
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

  const timelineEvents = calculateTimelineEvents(pipelineRunResult);

  return (
    <div
      style={{
        backgroundColor: '#f4f6f9',
        border: '1px solid #d6d9dc',
        borderRadius: '4px',
        padding: '1rem 1rem 1.5rem',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ marginTop: '0.5rem', marginBottom: 0 }}>Run Information</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'white',
            padding: '0.5rem 0.75rem',
            border: '1px solid #D8D9DC',
            borderRadius: '20px',
            fontWeight: 500,
          }}
        >
          <Icon icon='clock' size={16} style={{ color: colors.dark(0.7) }} />
          {calculateDuration(pipelineRunResult)}
        </div>
      </div>
      {timelineEvents.map((event, index) => (
        <div key={event.label}>{getTimelineEvent(pipelineRunResult, event, index === timelineEvents.length - 1)}</div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column' }} />
    </div>
  );
};

interface TimelineEvent {
  label: string;
  moreInfo?: string;
  status: string;
  timestamp?: string;
}

// While we don't have precise insight into which steps have actually completed, we can infer based on a few things:
// If an error message indicates QC failure, we know QC checks failed.
// If quota has been charged, we know the pipeline progressed past QC checks.
const getQcMessage = (pipelineRunResult: PipelineRunResponse): string | undefined => {
  if (pipelineRunResult.errorReport?.message?.includes('failed QC')) {
    return 'Input data failed QC checks';
  }
  if (pipelineRunResult.pipelineRunReport.quotaConsumed || pipelineRunResult.jobReport.completed) {
    return 'Input data passed QC checks';
  }
  return undefined;
};

const getQuotaMessage = (pipelineRunResult: PipelineRunResponse): string | undefined => {
  if (pipelineRunResult.pipelineRunReport.quotaConsumed) {
    return `${pipelineRunResult.pipelineRunReport.quotaConsumed} ${pipelineRunResult.pipelineRunReport.inputSizeUnits}`;
  }
  if (pipelineRunResult.jobReport.status === 'FAILED') {
    return 'No quota charged';
  }
  return undefined;
};

const getTerminalEventLabel = (pipelineRunResult: PipelineRunResponse): string => {
  if (pipelineRunResult.jobReport.status === 'SUCCEEDED') {
    return 'Pipeline Succeeded';
  }
  if (pipelineRunResult.jobReport.status === 'FAILED') {
    return 'Pipeline Failed';
  }
  return 'In Progress';
};

const calculateTimelineEvents = (pipelineRunResult: PipelineRunResponse): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  events.push({
    label: 'Submitted',
    status: pipelineRunResult.jobReport.submitted ? 'SUCCEEDED' : 'PENDING',
    timestamp: pipelineRunResult.jobReport.submitted,
  });

  const qcFailed = pipelineRunResult.errorReport?.message?.includes('failed QC');
  const pipelineFailed = pipelineRunResult.jobReport.status === 'FAILED';
  const quotaCharged = !!pipelineRunResult.pipelineRunReport.quotaConsumed;

  events.push({
    label: 'Quality Checks',
    status: qcFailed ? 'FAILED' : 'SUCCEEDED',
    moreInfo: getQcMessage(pipelineRunResult),
  });

  events.push({
    label: 'Quota Charged',
    // eslint-disable-next-line no-nested-ternary
    status: quotaCharged ? 'SUCCEEDED' : pipelineFailed ? 'CANCELLED' : 'SUCCEEDED',
    moreInfo: getQuotaMessage(pipelineRunResult),
  });

  events.push({
    label: getTerminalEventLabel(pipelineRunResult),
    timestamp: qcFailed ? undefined : pipelineRunResult.jobReport.completed,
    status: qcFailed ? 'CANCELLED' : pipelineRunResult.jobReport.status,
  });

  return events;
};

const getTimelineEvent = (pipelineRunResult: PipelineRunResponse, event: TimelineEvent, isLast: boolean) => {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginRight: '0.75rem',
          width: '20px',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            borderRadius: '50%',
            padding: '2px',
            marginBottom: isLast ? 0 : '0.5rem',
          }}
        >
          {getTimelineStatusIcon(event.status)}
        </div>

        {!isLast && (
          <div
            style={{
              width: '3px',
              flex: 1,
              backgroundColor: colors.light(0.2),
            }}
          />
        )}
      </div>

      {/* Timeline event content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem',
          border: '1px solid #d7d9dc',
          backgroundColor: 'white',
          borderRadius: '4px',
          minHeight: '4rem',
          marginBottom: isLast ? 0 : '0.5rem',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div
            style={{
              fontWeight: 'bold',
              color: colors.dark(),
            }}
          >
            {event.label}
          </div>
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

const getTimelineStatusIcon = (status: string) => {
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
