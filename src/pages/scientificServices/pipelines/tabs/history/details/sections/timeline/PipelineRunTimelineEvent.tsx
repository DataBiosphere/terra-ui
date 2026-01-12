import React from 'react';
import colors from 'src/libs/colors';
import {
  getTimelineEventStatusIcon,
  PipelineTimelineEvent,
} from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/timeline/pipeline-timeline-utils';

interface PipelineRunTimelineEventProps {
  event: PipelineTimelineEvent;
  isLast: boolean;
}

export const PipelineRunTimelineEvent = ({ event, isLast }: PipelineRunTimelineEventProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: isLast ? 0 : '0.5rem' }}>
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
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '-8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: '8px solid #d7d9dc',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: '7px solid white',
          }}
        />

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
