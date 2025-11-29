import { Icon, Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
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
    <div style={{ color: colors.dark(), fontWeight: 600 }}>{label}</div>
    <div style={{ fontWeight: 500, color: colors.dark(0.7) }}>{value}</div>
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

  return isLoadingPipelineDetails ? (
    <Spinner />
  ) : (
    <div
      style={{
        width: '100%',
        background: `linear-gradient(to right, #f5f6f9, ${getStatusColor(pipelineRunResult.jobReport.status)}15)`,
        border: '1px solid #d7d9dc',
        borderRadius: '4px',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        paddingBottom: '1.5rem',
        paddingTop: '0.5rem',
        marginBottom: '0.5rem',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h2>
              {pipelineDetails && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <AoUStylizedString text={pipelineDetails.displayName} />
                  <span
                    style={{
                      backgroundColor: 'white',
                      // color: colors.dark(0.8),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: 12,
                      marginLeft: '0.5rem',
                      fontWeight: 500,
                      border: '1px solid #d7d9dc',
                    }}
                  >
                    Version {pipelineRunResult.pipelineRunReport.pipelineVersion}
                  </span>
                </div>
              )}
            </h2>
            {pipelineDetails && pipelineDetails.description && (
              <div style={{ margin: '1rem 0rem', color: colors.dark(0.8) }}>{pipelineDetails.description}</div>
            )}
          </div>

          {/* Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'capitalize',
              fontSize: 18,
              fontWeight: 600,
              border: '1px solid #d7d9dc',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: getStatusColor(pipelineRunResult.jobReport.status),
            }}
          >
            {getStatusIcon(pipelineRunResult.jobReport.status)}
            {pipelineRunResult.jobReport.status.toLowerCase()}
          </div>
        </div>
      </div>
      {/* Description */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '2rem',
          flexWrap: 'wrap',
          // justifyContent: 'space-between',
        }}
      >
        {/* Job ID */}
        <InfoItem
          label='Job ID'
          value={
            <div>
              <code>{pipelineRunResult.jobReport.id}</code>
              <ClipboardButton style={{ marginLeft: '0.5rem' }} text={pipelineRunResult.jobReport.id} />
            </div>
          }
        />

        {/* Description */}
        <InfoItem label='Description' value={pipelineRunResult.jobReport.description || 'No description'} />
      </div>
    </div>
  );
};
