import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface JobInputsOutputsProps {
  pipelineRunResult: PipelineRunResponse;
}

export const JobInputsOutputs = ({ pipelineRunResult }: JobInputsOutputsProps) => {
  const { pipelineDetails, isLoading } = usePipelineDetails(
    pipelineRunResult.pipelineRunReport.pipelineName,
    pipelineRunResult.pipelineRunReport.pipelineVersion
  );

  // Extract inputs from the job submission (we'll need to get these from somewhere)
  // For now, we'll show that inputs would come from the pipeline run
  const hasOutputs =
    pipelineRunResult.pipelineRunReport.outputs && Object.keys(pipelineRunResult.pipelineRunReport.outputs).length > 0;

  const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.875rem', color: colors.dark(0.6), marginBottom: '0.25rem', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ color: colors.dark(), wordBreak: 'break-all' }}>{value}</div>
    </div>
  );

  return (
    <PipelineWidgetContainer title='Inputs & Outputs'>
      {isLoading ? (
        <div style={{ color: colors.dark(0.6) }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Inputs Column */}
          <div style={{ flex: 1 }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Inputs</h4>
            {pipelineDetails && pipelineDetails.inputs.length > 0 ? (
              <div>
                {/* @ts-ignore */}
                {Object.entries(pipelineRunResult.pipelineRunReport.inputs!).map(([key, value]) => (
                  <InfoItem
                    key={key}
                    label={key}
                    value={
                      <div style={{ fontSize: '0.875rem', color: colors.dark(0.7), fontStyle: 'italic' }}>
                        {/* Placeholder - actual input values would come from the job submission */}
                        {value}
                      </div>
                    }
                  />
                ))}
              </div>
            ) : (
              <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>No inputs defined</div>
            )}
          </div>

          {/* Arrow Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon='arrowRight' size={24} style={{ color: colors.dark(0.4) }} />
          </div>

          {/* Outputs Column */}
          <div style={{ flex: 1 }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Outputs</h4>
            {hasOutputs ? (
              <div>
                {Object.entries(pipelineRunResult.pipelineRunReport.outputs!).map(([key, value]) => (
                  <InfoItem
                    key={key}
                    label={key}
                    value={
                      <a
                        href={value}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          color: colors.accent(),
                          textDecoration: 'underline',
                          fontSize: '0.875rem',
                        }}
                      >
                        {value}
                      </a>
                    }
                  />
                ))}
              </div>
            ) : pipelineRunResult.jobReport.status === 'SUCCEEDED' ? (
              <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>No outputs available</div>
            ) : pipelineRunResult.jobReport.status === 'RUNNING' ||
              pipelineRunResult.jobReport.status === 'PREPARING' ? (
              <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>
                Outputs will be available when job completes
              </div>
            ) : (
              <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>No outputs generated</div>
            )}
          </div>
        </div>
      )}
    </PipelineWidgetContainer>
  );
};
