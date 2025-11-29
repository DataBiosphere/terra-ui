import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface JobTimelineProps {
  pipelineRunResult: PipelineRunResponse;
}

const MOCK_TIMELINE_EVENTS = [
  { timestamp: '2024-01-01T10:00:00Z', event: 'Submitted' },
  { timestamp: '2024-01-01T10:05:10Z', event: 'Passed QC' },
  { timestamp: '2024-01-01T10:06:22Z', event: 'Quota Charged' },
  { timestamp: '2024-01-01T10:08:11Z', event: 'Started' },
  { timestamp: '2024-01-01T10:20:01Z', event: 'Succeeded' },
];

export const JobTimeline = ({ pipelineRunResult }: JobTimelineProps) => {
  // Calculate job duration from first to last event
  const firstEvent = MOCK_TIMELINE_EVENTS[0];
  const lastEvent = MOCK_TIMELINE_EVENTS[MOCK_TIMELINE_EVENTS.length - 1];
  const startTime = new Date(firstEvent.timestamp);
  const endTime = new Date(lastEvent.timestamp);
  const durationMs = endTime.getTime() - startTime.getTime();

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
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
              <div style={{ marginRight: '0.75rem' }}>
                <Icon icon='success-standard' size={20} style={{ color: colors.success() }} />
              </div>

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
                  <div>{new Date(event.timestamp).toLocaleString()}</div>
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

                {event.event === 'Quota Charged' && (
                  <div
                    style={{
                      marginTop: '0.25rem',
                      fontSize: 14,
                      color: colors.dark(0.7),
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div>524 samples </div>
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
              <div
                style={{
                  width: '3px',
                  height: '1.5rem',
                  backgroundColor: colors.light(0.2),
                  marginLeft: 'calc(50% - 1px)',
                  position: 'relative',
                  zIndex: 0,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
