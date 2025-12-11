import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import { TooltipTrigger } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { PipelineInput, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
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

const InfoItem = ({ label, value, tooltip }: { label: string; value: ReactNode; tooltip: string }) => (
  <div>
    <div style={{ marginBottom: '0.5rem', fontWeight: 500, textTransform: 'capitalize' }}>
      <TooltipTrigger content={tooltip}>
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
          // TODO: capture mixpanel download metric
          window.open(url, '_blank');
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

interface JobInputsProps {
  inputDefinitions: PipelineInput[];
  inputs: Record<string, any>;
}

const JobInputs = ({ inputDefinitions, inputs }: JobInputsProps) => {
  const hasInputs = inputs && Object.keys(inputs).length > 0;

  return (
    <div style={{ flex: 1 }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Inputs</h4>
      {hasInputs ? (
        <div>
          {Object.entries(inputs).map(([key, value]) => (
            <div
              key={key}
              style={{
                marginTop: '1rem',
                border: '1px solid #d7d9dc',
                padding: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '4px',
              }}
            >
              <InfoItem
                label={inputDefinitions.find((input) => input.name === key)?.displayName || key}
                value={
                  <div style={{ fontSize: 13 }}>
                    <code>{value}</code>
                  </div>
                }
                tooltip={
                  inputDefinitions.find((input) => input.name === key)?.description ||
                  'No description available for this input'
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>No inputs available</div>
      )}
    </div>
  );
};

interface JobOutputsProps {
  outputs: Record<string, string> | undefined;
  status: string;
}

const JobOutputs = ({ outputs, status }: JobOutputsProps) => {
  const hasOutputs = outputs && Object.keys(outputs).length > 0;
  const isSucceeded = status === 'SUCCEEDED';
  const isRunning = status === 'RUNNING' || status === 'PREPARING';

  const getEmptyMessage = () => {
    if (isSucceeded) {
      return 'No outputs available';
    }
    if (isRunning) {
      return 'Outputs will be available when job completes';
    }
    return 'No outputs generated';
  };

  return (
    <div style={{ flex: 1, opacity: isSucceeded ? 1 : 0.5 }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Outputs</h4>
      {hasOutputs ? (
        <div>
          {Object.entries(outputs!).map(([key, value]) => (
            <div
              key={key}
              style={{
                marginTop: '1rem',
                borderLeft: '3px solid #e4e5e6',
                padding: '0.5rem',
                backgroundColor: 'white',
                border: '1px solid #d7d9dc',
                borderRadius: '4px',
              }}
            >
              <OutputItem label={key} url={value} fileSize={MOCK_FILE_SIZES[key] || '0 KB'} disabled={!isSucceeded} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>{getEmptyMessage()}</div>
      )}
    </div>
  );
};

export const JobInputsOutputs = ({ pipelineRunResult }: JobInputsOutputsProps) => {
  const { pipelineDetails, isLoading } = usePipelineDetails(
    pipelineRunResult.pipelineRunReport.pipelineName,
    pipelineRunResult.pipelineRunReport.pipelineVersion
  );

  const inputDefinitions = pipelineDetails?.inputs || [];

  return (
    <PipelineWidgetContainer title='Inputs & Outputs' border='1px solid #d7d9dc' showIcon={false}>
      {isLoading ? (
        <div style={{ color: colors.dark(0.6) }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <JobInputs
            inputDefinitions={inputDefinitions}
            inputs={pipelineRunResult.pipelineRunReport.userInputs || {}}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon='arrowRight' size={24} style={{ color: colors.dark(0.7) }} />
          </div>

          <JobOutputs
            outputs={pipelineRunResult.pipelineRunReport.outputs}
            status={pipelineRunResult.jobReport.status}
          />
        </div>
      )}
    </PipelineWidgetContainer>
  );
};
