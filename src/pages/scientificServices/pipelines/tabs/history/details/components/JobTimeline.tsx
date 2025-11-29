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
  { timestamp: '2024-01-01T10:20:01Z', event: 'Job Completed' },
];

export const JobTimeline = ({ pipelineRunResult }: JobTimelineProps) => {
  return (
    <PipelineWidgetContainer title='Timeline' border='1px solid #d7d9dc'>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {MOCK_TIMELINE_EVENTS.map((event, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              borderLeft: '3px solid #5CC88D',
              paddingLeft: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>{event.event}</div>
              {event.event === 'Passed QC' && (
                <div style={{ fontSize: '0.875rem', color: '#46A3E9', fontStyle: 'italic' }}>
                  <a target='_blank' href='https://app.terra.bio' rel='noreferrer'>
                    Learn more about the QC process
                  </a>
                </div>
              )}
            </div>
            <div>{new Date(event.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </PipelineWidgetContainer>
  );
};
