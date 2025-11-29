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
  { timestamp: '2024-01-01T10:05:37Z', event: 'Passed QC' },
  { timestamp: '2024-01-01T10:05:11Z', event: 'Started' },
  { timestamp: '2024-01-01T10:20:01Z', event: 'Completed' },
];

export const JobTimeline = ({ pipelineRunResult }: JobTimelineProps) => {
  return (
    <PipelineWidgetContainer title='Timeline' border='1px solid #d7d9dc'>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {MOCK_TIMELINE_EVENTS.map((event, index) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center', // vertically center content
              padding: '0.75rem',
              borderLeft: '3px solid #5CC88D',
              backgroundColor: 'white',
              borderBottomRightRadius: '4px',
              borderTopRightRadius: '4px',
              minHeight: '4rem',
            }}
          >
            <div style={{ flex: 1 }}>
              {/* Top row: event name left, timestamp right */}
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
            </div>
          </div>
        ))}
      </div>
    </PipelineWidgetContainer>
  );
};
