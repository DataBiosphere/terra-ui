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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {MOCK_TIMELINE_EVENTS.map((event, index) => (
          <div key={index} style={{ position: 'relative' }}>
            {/* Timeline event */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: 'white',
                borderRadius: '4px',
                minHeight: '4rem',
              }}
            >
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
              </div>
            </div>

            {/* Connecting line to next event */}
            {index < MOCK_TIMELINE_EVENTS.length - 1 && (
              <div
                style={{
                  width: '3px',
                  height: '2rem',
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
    </PipelineWidgetContainer>
  );
};
