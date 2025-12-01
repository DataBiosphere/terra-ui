import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import { TooltipTrigger } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface JobInputsOutputsProps {
  pipelineRunResult: PipelineRunResponse;
}

// Mock file sizes for demonstration
const MOCK_FILE_SIZES: Record<string, string> = {
  'Imputed Multi-Sample VCF': '2.4 GB',
  'Imputed Multi-Sample VCF Index': '1.2 MB',
  'Contigs Metrics TSV': '45 KB',
  'Imputation Chunks QC TSV': '128 KB',
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
      <TooltipTrigger content='Here is a full description for the input'>
        <span>{label}</span>
      </TooltipTrigger>
    </div>
    <div style={{ color: colors.dark(), wordBreak: 'break-all' }}>{value}</div>
  </div>
);

const OutputItem = ({
  label,
  url,
  fileSize,
  disabled,
}: {
  label: string;
  url: string;
  fileSize: string;
  disabled?: boolean;
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: disabled ? colors.dark(0.5) : colors.dark() }}>
            {disabled ? 'Not available' : fileSize}
          </span>
        </div>
      </div>
      <ButtonPrimary
        onClick={() => {
          console.log(url);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem',
          gap: '0.25rem',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          marginLeft: '1rem',
          opacity: disabled ? 0.5 : 1,
        }}
        disabled={disabled}
      >
        <Icon icon='download' size={16} />
      </ButtonPrimary>
    </div>
  );
};

export const JobInputsOutputs = ({ pipelineRunResult }: JobInputsOutputsProps) => {
  const { pipelineDetails, isLoading } = usePipelineDetails(
    pipelineRunResult.pipelineRunReport.pipelineName,
    pipelineRunResult.pipelineRunReport.pipelineVersion
  );

  const hasOutputs =
    pipelineRunResult.pipelineRunReport.outputs && Object.keys(pipelineRunResult.pipelineRunReport.outputs).length > 0;

  return (
    <PipelineWidgetContainer title='Inputs & Outputs' border='1px solid #d7d9dc' showIcon={false}>
      {isLoading ? (
        <div style={{ color: colors.dark(0.6) }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {/* Inputs Column */}
          <div style={{ flex: 1 }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Inputs</h4>
            {pipelineDetails && pipelineDetails.inputs.length > 0 ? (
              <div>
                {/* @ts-ignore */}
                {Object.entries(pipelineRunResult.pipelineRunReport.inputs!).map(([key, value]) => (
                  <div
                    style={{
                      marginTop: '1rem',
                      // borderLeft: '3px solid #e4e5e6',
                      border: '1px solid #d7d9dc',
                      padding: '0.5rem',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      // borderBottomRightRadius: '4px',
                      // borderTopRightRadius: '4px',
                    }}
                  >
                    <InfoItem
                      key={key}
                      label={key}
                      value={
                        <div style={{ fontSize: 13 }}>
                          <code>{value}</code>
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>No inputs defined</div>
            )}
          </div>

          {/* Arrow Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon='arrowRight' size={24} style={{ color: colors.dark(0.7) }} />
          </div>

          {/* Outputs Column */}
          <div style={{ flex: 1, opacity: pipelineRunResult.jobReport.status === 'SUCCEEDED' ? 1 : 0.5 }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Outputs</h4>
            {hasOutputs ? (
              <div>
                {Object.entries(pipelineRunResult.pipelineRunReport.outputs!).map(([key, value]) => (
                  <div
                    style={{
                      marginTop: '1rem',
                      borderLeft: '3px solid #e4e5e6',
                      padding: '0.5rem',
                      backgroundColor: 'white',
                      border: '1px solid #d7d9dc',
                      borderRadius: '4px',
                    }}
                  >
                    <OutputItem
                      key={key}
                      label={key}
                      url={value}
                      fileSize={MOCK_FILE_SIZES[key] || '0 KB'}
                      disabled={pipelineRunResult.jobReport.status !== 'SUCCEEDED'}
                    />
                  </div>
                ))}
              </div>
            ) : pipelineRunResult.jobReport.status === 'SUCCEEDED' ? (
              <div style={{}}>No outputs available</div>
            ) : pipelineRunResult.jobReport.status === 'RUNNING' ||
              pipelineRunResult.jobReport.status === 'PREPARING' ? (
              <div style={{}}>Outputs will be available when job completes</div>
            ) : (
              <div style={{}}>No outputs generated</div>
            )}
          </div>
        </div>
      )}
    </PipelineWidgetContainer>
  );
};
