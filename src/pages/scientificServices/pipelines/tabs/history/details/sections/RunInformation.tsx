import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';

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

  // Get icon based on status
  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'SUCCESS':
  //       return <Icon icon='success-standard' size={20} style={{ color: colors.success() }} />;
  //     case 'RUNNING':
  //       return <Icon icon='sync' size={20} style={{ color: colors.accent() }} />;
  //     case 'QUEUED':
  //       return (
  //         <div
  //           style={{
  //             width: '20px',
  //             height: '20px',
  //             borderRadius: '50%',
  //             backgroundColor: colors.dark(0.3),
  //             border: `2px solid ${colors.dark(0.3)}`,
  //           }}
  //         />
  //       );
  //     case 'FAILED':
  //       return <Icon icon='warning-standard' size={20} style={{ color: colors.danger() }} />;
  //     default:
  //       return <Icon icon='success-standard' size={20} style={{ color: colors.success() }} />;
  //   }
  // };

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
      <div style={{ display: 'flex', flexDirection: 'column' }} />
    </div>
  );
};
