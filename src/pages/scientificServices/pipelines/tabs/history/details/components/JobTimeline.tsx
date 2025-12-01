import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface JobTimelineProps {
  pipelineRunResult: PipelineRunResponse;
}

const SUCCESS_MOCK_TIMELINE_EVENTS = [
  { timestamp: '2024-01-01T10:00:00Z', event: 'Submitted', status: 'SUCCESS' },
  { timestamp: '2024-01-01T10:05:10Z', event: 'Passed QC', status: 'SUCCESS' },
  { timestamp: '2024-01-01T10:06:22Z', event: 'Quota Charged', status: 'SUCCESS' },
  { timestamp: '2024-01-01T10:08:11Z', event: 'Started', status: 'SUCCESS' },
  { timestamp: '2024-01-01T10:20:01Z', event: 'Succeeded', status: 'SUCCESS' },
];

const FAILED_MOCK_TIMELINE_EVENTS = [
  { timestamp: '2024-01-01T10:00:00Z', event: 'Submitted', status: 'SUCCESS' },
  { timestamp: '2024-01-01T10:05:10Z', event: 'Failed QC', status: 'FAILED' },
  { timestamp: undefined, event: 'Quota Charged', status: 'QUEUED' },
  { timestamp: undefined, event: 'Started', status: 'QUEUED' },
  { timestamp: undefined, event: 'Completed', status: 'QUEUED' },
];

export const JobTimeline = ({ pipelineRunResult }: JobTimelineProps) => {
  const MOCK_TIMELINE_EVENTS =
    pipelineRunResult.jobReport.status === 'SUCCEEDED' ? SUCCESS_MOCK_TIMELINE_EVENTS : FAILED_MOCK_TIMELINE_EVENTS;

  // Calculate job duration from first to last event with valid timestamps
  const eventsWithTimestamps = MOCK_TIMELINE_EVENTS.filter((event) => event.timestamp);
  const firstEvent = eventsWithTimestamps[0];
  const lastEvent = eventsWithTimestamps[eventsWithTimestamps.length - 1];

  let durationMs = 0;
  if (firstEvent && lastEvent && firstEvent.timestamp && lastEvent.timestamp) {
    const startTime = new Date(firstEvent.timestamp);
    const endTime = new Date(lastEvent.timestamp);
    durationMs = endTime.getTime() - startTime.getTime();
  }

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms === 0) {
      return 'In progress';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Get icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Icon icon='success-standard' size={20} style={{ color: colors.success() }} />;
      case 'RUNNING':
        return <Icon icon='sync' size={20} style={{ color: colors.accent() }} />;
      case 'QUEUED':
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
      case 'FAILED':
        return <Icon icon='warning-standard' size={20} style={{ color: colors.danger() }} />;
      default:
        return <Icon icon='success-standard' size={20} style={{ color: colors.success() }} />;
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#f4f6f9',
        border: '1px solid #d7d9dc',
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
        <h3 style={{ marginTop: '0.5rem', marginBottom: 0 }}>Timeline</h3>
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
          {formatDuration(durationMs)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {MOCK_TIMELINE_EVENTS.map((event, index) => (
          <div key={index} style={{ position: 'relative' }}>
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
              {/* Success icon */}
              <div style={{ marginRight: '0.75rem' }}>{getStatusIcon(event.status)}</div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{event.event}</div>
                  <div>
                    {event.timestamp ? (
                      new Date(event.timestamp).toLocaleString()
                    ) : pipelineRunResult.jobReport.status === 'FAILED' ? (
                      ''
                    ) : (
                      <span style={{ color: colors.dark(0.5), fontStyle: 'italic' }}>Pending</span>
                    )}
                  </div>
                </div>

                {/* Conditional QC message */}
                {event.event === 'Passed QC' && (
                  <div
                    style={{
                      marginTop: '0.25rem',
                      fontSize: 14,
                      color: '#46A3E9',
                      fontStyle: 'italic',
                    }}
                  >
                    <a target='_blank' href='https://app.terra.bio' rel='noreferrer'>
                      Learn more about the QC process
                      <Icon icon='pop-out' size={12} style={{ marginLeft: '0.25rem' }} />
                    </a>
                  </div>
                )}

                {event.event === 'Failed QC' && (
                  <div
                    style={{
                      marginTop: '0.25rem',
                      fontSize: 14,
                      color: colors.danger(),
                      fontStyle: 'italic',
                    }}
                  >
                    {'Input failed QC: VCF version < 4.0 or not found.'}
                  </div>
                )}

                {event.event === 'Quota Charged' && (
                  <div
                    style={{
                      marginTop: '0.25rem',
                      fontSize: 14,
                      color: colors.dark(0.7),
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
                    >
                      {pipelineRunResult.jobReport.status === 'SUCCEEDED' && <div>524 samples</div>}
                      {pipelineRunResult.jobReport.status === 'FAILED' && (
                        <div style={{ fontStyle: 'italic' }}>No quota charged.</div>
                      )}
                      <div
                        style={{
                          fontSize: 14,
                          color: '#46A3E9',
                          fontStyle: 'italic',
                        }}
                      >
                        <a target='_blank' href='https://app.terra.bio' rel='noreferrer'>
                          Learn more about quota
                          <Icon icon='pop-out' size={12} style={{ marginLeft: '0.25rem' }} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Connecting line to next event */}
            {index < MOCK_TIMELINE_EVENTS.length - 1 && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
