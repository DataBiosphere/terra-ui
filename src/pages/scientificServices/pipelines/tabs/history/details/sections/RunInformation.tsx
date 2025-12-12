import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { getPipelineStatusIcon } from 'src/pages/scientificServices/pipelines/utils/pipeline-style-utils';

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
      {calculateTimelineEvents(pipelineRunResult).map((event) => (
        <div key={event.label}>{getTimelineEvent(pipelineRunResult, event)}</div>
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

const calculateTimelineEvents = (pipelineRunResult: PipelineRunResponse): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  events.push({
    label: 'Submitted',
    status: pipelineRunResult.jobReport.submitted ? 'SUCCEEDED' : 'PENDING',
    timestamp: pipelineRunResult.jobReport.submitted,
  });

  const qcFailed = pipelineRunResult.errorReport?.message?.includes('failed QC');
  const pipelineFailed = pipelineRunResult.jobReport.status === 'FAILED';

  const qcCheckStatus = (() => {
    if (qcFailed) return 'FAILED';
    if ((pipelineFailed && !qcFailed) || pipelineRunResult.pipelineRunReport.quotaConsumed) return 'SUCCEEDED';
    return 'PENDING';
  })();

  events.push({
    label: 'QC Checks',
    status: qcCheckStatus,
    timestamp: qcFailed ? pipelineRunResult.jobReport.completed : undefined,
    moreInfo: qcFailed ? pipelineRunResult.errorReport?.message : undefined,
  });

  events.push({
    label: 'Quota Charged',
    status:
      // eslint-disable-next-line no-nested-ternary
      qcFailed || pipelineFailed
        ? 'CANCELLED'
        : pipelineRunResult.pipelineRunReport.quotaConsumed
        ? 'SUCCEEDED'
        : 'PENDING',
    timestamp: undefined,
    moreInfo:
      pipelineRunResult.jobReport.status === 'FAILED'
        ? 'No quota charged.'
        : `${pipelineRunResult.pipelineRunReport.quotaConsumed} ${pipelineRunResult.pipelineRunReport.inputSizeUnits} charged`,
  });

  events.push({
    label: 'Running',
    status: qcFailed ? 'CANCELLED' : pipelineRunResult.jobReport.status,
    timestamp: undefined,
  });

  if (pipelineRunResult.jobReport.completed) {
    events.push({
      label: 'Completed',
      timestamp: qcFailed ? undefined : pipelineRunResult.jobReport.completed,
      status: qcFailed ? 'CANCELLED' : pipelineRunResult.jobReport.status,
    });
  }

  return events;
};

const getTimelineEvent = (pipelineRunResult: PipelineRunResponse, event: TimelineEvent) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* Timeline event */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem',
          border: '1px solid #d7d9dc',
          backgroundColor: 'white',
          borderRadius: '4px',
          minHeight: '4rem',
        }}
      >
        <div style={{ marginRight: '0.75rem' }}>{getTimelineStatusIcon(event.status)}</div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                color: colors.dark(),
              }}
            >
              {event.label}
            </div>
            <div>
              {event.timestamp ? (
                <div style={{ marginLeft: '1rem', color: colors.dark(0.7), fontStyle: 'italic', fontSize: '0.875rem' }}>
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              ) : (
                <span style={{ color: colors.dark(0.5), fontStyle: 'italic' }}>
                  {event.status === 'CANCELLED' ? 'Cancelled' : ''}
                </span>
              )}
            </div>
            {event.moreInfo && (
              <div style={{ marginLeft: '1rem', color: colors.dark(0.7), fontStyle: 'italic', fontSize: '0.875rem' }}>
                {event.moreInfo}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connecting line to next event */}
      {
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '3px',
              height: '1.5rem',
              backgroundColor: colors.light(0.2),
              position: 'relative',
              zIndex: 0,
            }}
          />
          {/* Empty circle in the middle of the line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '8px',
              backgroundColor: 'white',
              border: `2px solid ${colors.light(0.4)}`,
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
        </div>
      }
    </div>
  );
};

const getTimelineStatusIcon = (status: string) => {
  if (status === 'PENDING' || status === 'CANCELLED') {
    return (
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: colors.dark(0.3),
          border: `2px solid ${colors.dark(0.3)}`,
        }}
      />
    );
  }
  return getPipelineStatusIcon(status, 20);
};
