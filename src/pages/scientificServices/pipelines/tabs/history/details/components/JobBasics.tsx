import { Icon, Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { pipelineNameToColor } from 'src/pages/scientificServices/pipelines/tabs/history/JobHistory';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';

interface JobBasicsProps {
  pipelineRunResult: PipelineRunResponse;
}

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <div style={{ color: colors.dark(0.6), fontWeight: 500 }}>{label}</div>
    <div style={{ fontWeight: 600, color: colors.dark() }}>{value}</div>
  </div>
);

export const JobBasics = ({ pipelineRunResult }: JobBasicsProps) => {
  const { pipelineDetails, isLoading: isLoadingPipelineDetails } = usePipelineDetails(
    pipelineRunResult.pipelineRunReport.pipelineName,
    pipelineRunResult.pipelineRunReport.pipelineVersion
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return <Icon icon='success-standard' size={16} style={{ color: colors.success() }} />;
      case 'RUNNING':
        return <Icon icon='sync' size={16} style={{ color: colors.accent() }} />;
      case 'PREPARING':
        return <Icon icon='sync' size={16} style={{ color: colors.warning() }} />;
      case 'FAILED':
        return <Icon icon='warning-standard' size={16} style={{ color: colors.danger() }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return colors.success();
      case 'RUNNING':
        return colors.accent();
      case 'PREPARING':
        return colors.warning();
      case 'FAILED':
        return colors.danger();
      default:
        return colors.dark();
    }
  };

  const calculateDuration = () => {
    if (!pipelineRunResult.jobReport.completed) {
      return 'In progress';
    }

    const submitted = new Date(pipelineRunResult.jobReport.submitted);
    const completed = new Date(pipelineRunResult.jobReport.completed);
    const durationMs = completed.getTime() - submitted.getTime();

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return isLoadingPipelineDetails ? (
    <Spinner />
  ) : (
    <div
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.light()}`,
        borderRadius: '4px',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        paddingBottom: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h2>{pipelineDetails && <AoUStylizedString text={pipelineDetails.displayName} />}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Pipeline Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px' }}>
          <div style={{ color: colors.dark(0.6), fontWeight: 500 }}>Pipeline</div>
          <div
            style={{
              width: 'fit-content',
              fontWeight: 600,
              backgroundColor: pipelineNameToColor(pipelineRunResult.pipelineRunReport.pipelineName),
              padding: '0.33rem',
              borderRadius: '4px',
            }}
          >
            {pipelineRunResult.pipelineRunReport.pipelineName}{' '}
            {pipelineRunResult.pipelineRunReport.pipelineVersion
              ? `v${pipelineRunResult.pipelineRunReport.pipelineVersion}`
              : ''}
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ color: colors.dark(0.6), fontWeight: 500 }}>Status</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'capitalize',
              fontWeight: 600,
              color: getStatusColor(pipelineRunResult.jobReport.status),
            }}
          >
            {getStatusIcon(pipelineRunResult.jobReport.status)}
            {pipelineRunResult.jobReport.status.toLowerCase()}
          </div>
        </div>

        {/* Job ID */}
        <InfoItem label='Job ID' value={<code>{pipelineRunResult.jobReport.id}</code>} />

        {/* Submitted */}
        <InfoItem
          label='Submitted'
          value={
            <div>
              <div>{new Date(pipelineRunResult.jobReport.submitted).toLocaleString()}</div>
            </div>
          }
        />

        {/* Completed */}
        {pipelineRunResult.jobReport.completed ? (
          <InfoItem
            label='Completed'
            value={
              <div>
                <div>{new Date(pipelineRunResult.jobReport.completed).toLocaleString()}</div>
              </div>
            }
          />
        ) : (
          <InfoItem label='Completed' value='—' />
        )}

        {/* Duration */}
        <InfoItem label='Duration' value={calculateDuration()} />
      </div>
    </div>
  );
};
