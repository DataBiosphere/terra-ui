import { Icon, Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse, PipelineWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { PipelineErrorMessage } from 'src/pages/scientificServices/pipelines/common/PipelineErrorMessage';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { JobInputsView } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/io/JobInputsView';
import { JobOutputsView } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/io/JobOutputsView';

interface PipelineRunIOViewProps {
  pipelineRunResult: PipelineRunResponse;
  // Bypasses the pipeline details fetch, e.g. to preview outputs types the backend doesn't return yet
  pipelineDetailsOverride?: PipelineWithDetails;
}

export const JobIOView = ({ pipelineRunResult, pipelineDetailsOverride }: PipelineRunIOViewProps) => {
  const { pipelineDetails, isLoading } = usePipelineDetails(
    pipelineRunResult.pipelineRunReport.pipelineName,
    pipelineRunResult.pipelineRunReport.pipelineVersion,
    !pipelineDetailsOverride
  );

  const effectivePipelineDetails = pipelineDetailsOverride || pipelineDetails;
  const inputDefinitions = effectivePipelineDetails?.inputs || [];
  const outputDefinitions = effectivePipelineDetails?.outputs || [];

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
      <h3 style={{ marginTop: '1rem', marginBottom: '1rem' }}>Inputs & Outputs</h3>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.dark(0.6) }}>
          <Spinner size={16} />
          Loading...
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem' }}>
          <JobInputsView inputDefinitions={inputDefinitions} pipelineRunResult={pipelineRunResult} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon='arrowRight' size={24} style={{ color: colors.dark(0.8) }} />
          </div>

          <div style={{ flex: 1 }}>
            <JobOutputsView outputDefinitions={outputDefinitions} pipelineRunResult={pipelineRunResult} />
            {pipelineRunResult.errorReport && (
              <PipelineErrorMessage
                title='No outputs were generated due to the following error:'
                message={pipelineRunResult.errorReport.message}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
