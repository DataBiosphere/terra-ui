import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { calculateTimelineEvents } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/timeline/pipeline-timeline-utils';

import { PipelineRunTimelineEvent } from './PipelineRunTimelineEvent';

interface PipelineRunTimelineProps {
  pipelineRunResult: PipelineRunResponse;
}

export const PipelineRunTimeline = ({ pipelineRunResult }: PipelineRunTimelineProps) => {
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
        <h3>Timeline</h3>
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
          {calculateRunDuration(pipelineRunResult)}
        </div>
      </div>
      {timelineEvents.map((event, index) => (
        <PipelineRunTimelineEvent key={event.label} event={event} isLast={index === timelineEvents.length - 1} />
      ))}
    </div>
  );
};

const calculateRunDuration = (pipelineRunResult: PipelineRunResponse): string => {
  if (!pipelineRunResult.jobReport.submitted || !pipelineRunResult.jobReport.completed) {
    return 'N/A';
  }

  const durationMs =
    new Date(pipelineRunResult.jobReport.completed).getTime() -
    new Date(pipelineRunResult.jobReport.submitted).getTime();

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};
