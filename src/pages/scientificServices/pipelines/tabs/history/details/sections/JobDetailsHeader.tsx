import { Spinner } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';
import {
  getPipelineStatusColor,
  getPipelineStatusIcon,
} from 'src/pages/scientificServices/pipelines/utils/pipeline-style-utils';

interface JobDetailsHeaderProps {
  pipelineRunResult: PipelineRunResponse;
}

const HeaderItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <div style={{ color: colors.dark(), fontWeight: 600 }}>{label}</div>
    <div style={{ color: colors.dark(0.7) }}>{value}</div>
  </div>
);

export const JobDetailsHeader = ({ pipelineRunResult }: JobDetailsHeaderProps) => {
  const { pipelineDetails, isLoading: isLoadingPipelineDetails } = usePipelineDetails(
    pipelineRunResult.pipelineRunReport.pipelineName,
    pipelineRunResult.pipelineRunReport.pipelineVersion
  );

  return isLoadingPipelineDetails ? (
    <Spinner />
  ) : (
    <div
      style={{
        width: '100%',
        background: `linear-gradient(to right, #f5f6f9, ${getPipelineStatusColor(
          pipelineRunResult.jobReport.status
        )}15)`,
        border: '1px solid #d6d9dc',
        borderRadius: '4px',
        padding: '0.5rem 1.5rem 1.5rem',
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
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: 12,
                      marginLeft: '0.5rem',
                      fontWeight: 500,
                      border: '1px solid #d6d9dc',
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'capitalize',
              fontSize: 18,
              fontWeight: 600,
              border: '1px solid #d6d9dc',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: getPipelineStatusColor(pipelineRunResult.jobReport.status),
            }}
          >
            {getPipelineStatusIcon(pipelineRunResult.jobReport.status)}
            {pipelineRunResult.jobReport.status.toLowerCase()}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <HeaderItem
          label='Job ID'
          value={
            <>
              <code>{pipelineRunResult.jobReport.id}</code>
              <ClipboardButton style={{ marginLeft: '0.5rem' }} text={pipelineRunResult.jobReport.id} />
            </>
          }
        />

        <HeaderItem label='Description' value={pipelineRunResult.jobReport.description || 'No description'} />
      </div>
    </div>
  );
};
