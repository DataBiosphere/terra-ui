import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { JobInputsView } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/io/JobInputsView';
import { JobOutputsView } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/io/JobOutputsView';

interface PipelineRunIOViewProps {
  pipelineRunResult: PipelineRunResponse;
}

export const JobInputsOutputsView = ({ pipelineRunResult: foo }: PipelineRunIOViewProps) => {
  const { pipelineDetails, isLoading } = usePipelineDetails(
    foo.pipelineRunReport.pipelineName,
    foo.pipelineRunReport.pipelineVersion
  );

  const inputDefinitions = pipelineDetails?.inputs || [];
  const outputDefinitions = pipelineDetails?.outputs || [];

  const pipelineRunResult = {
    ...foo,
    pipelineRunReport: {
      ...foo.pipelineRunReport,
      outputs:
        foo.jobReport.status === 'SUCCEEDED'
          ? {
              imputedMultiSampleVcfIndex: 'empty_file',
              imputedMultiSampleVcf: 'empty_file',
              contigsInfo: 'empty_file',
              chunksInfo: 'empty_file',
            }
          : undefined,
    },
  };

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
      <h3 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>Inputs & Outputs</h3>
      {isLoading ? (
        <div style={{ color: colors.dark(0.6) }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <JobInputsView
            inputDefinitions={inputDefinitions}
            inputs={pipelineRunResult.pipelineRunReport.userInputs || {}}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon='arrowRight' size={24} style={{ color: colors.dark(0.8) }} />
          </div>

          <div style={{ flex: 1 }}>
            <JobOutputsView
              outputDefinitions={outputDefinitions}
              outputs={pipelineRunResult.pipelineRunReport.outputs}
              status={pipelineRunResult.jobReport.status}
            />
            {pipelineRunResult.errorReport && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  backgroundColor: '#f8d7da',
                  color: '#842029',
                }}
              >
                <div style={{ margin: '1rem 0', fontWeight: 'bold' }}>
                  No outputs were generated due to the following error:
                </div>
                <div style={{ margin: '1rem 0', fontFamily: 'monospace' }}>{pipelineRunResult.errorReport.message}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
