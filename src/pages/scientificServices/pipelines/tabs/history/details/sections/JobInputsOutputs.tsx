import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import { TooltipTrigger } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { PipelineInput, PipelineOutput, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { InputTypeBadge } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/InputTypeBadge';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface JobInputsOutputsProps {
  pipelineRunResult: PipelineRunResponse;
}

const InputItem = ({
  label,
  value,
  tooltip,
  inputType,
}: {
  label: string;
  value: ReactNode;
  tooltip: string;
  inputType: string;
}) => (
  <div>
    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <TooltipTrigger content={tooltip}>
        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{label}</span>
      </TooltipTrigger>
      <InputTypeBadge type={inputType} />
    </div>
    <div style={{ color: colors.dark(), wordBreak: 'break-all' }}>{value}</div>
  </div>
);

const OutputItem = ({
  label,
  url,
  outputType,
  fileSize,
  disabled,
}: {
  label: string;
  url: string;
  outputType: string;
  fileSize: string;
  disabled?: boolean;
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{label}</span>
          <InputTypeBadge type={outputType} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: disabled ? colors.dark(0.5) : colors.dark() }}>
            {disabled ? 'Not available' : fileSize}
          </span>
        </div>
      </div>
      <div style={{ borderLeft: '1px solid #d7d9dc' }}>
        <ButtonPrimary
          onClick={() => {
            // TODO: capture mixpanel download metric
            window.open(url, '_blank');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            marginLeft: '0.5rem',
            opacity: disabled ? 0.5 : 1,
          }}
          disabled={disabled}
        >
          <Icon icon='download' size={16} />
        </ButtonPrimary>
      </div>
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
          {Object.entries(inputs).map(([key, value]) => {
            const inputDef = inputDefinitions.find((input) => input.name === key);
            return (
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
                <InputItem
                  label={inputDef?.displayName || key}
                  value={
                    <div style={{ fontSize: 13 }}>
                      <code>{value}</code>
                    </div>
                  }
                  tooltip={inputDef?.description || 'No description available for this input'}
                  inputType={inputDef?.type || 'STRING'}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>No inputs available</div>
      )}
    </div>
  );
};

interface JobOutputsProps {
  outputDefinitions: PipelineOutput[];
  outputs: Record<string, string> | undefined;
  status: string;
}

const JobOutputs = ({ outputDefinitions, outputs, status }: JobOutputsProps) => {
  const hasOutputs = outputs && Object.keys(outputs).length > 0;
  const isSucceeded = status === 'SUCCEEDED';
  const isFailed = status === 'FAILED';

  const getEmptyMessage = () => {
    if (isSucceeded) {
      return 'No outputs available';
    }
    if (status === 'RUNNING') {
      return 'Outputs will be available when job completes';
    }
    if (isFailed) {
      return 'No outputs generated due to job failure';
    }
  };

  return (
    <div style={{ flex: 1 }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Outputs</h4>
      {hasOutputs ? (
        <div>
          {Object.entries(outputs).map(([key, value]) => (
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
              <OutputItem
                label={outputDefinitions.find((output) => output.name === key)?.displayName || key}
                outputType={outputDefinitions.find((output) => output.name === key)?.type || 'Unknown'}
                url={value}
                fileSize='n/a KB'
                disabled={!isSucceeded}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: colors.dark(0.6), fontSize: '0.875rem', fontStyle: isFailed ? 'italic' : 'normal' }}>
          {getEmptyMessage()}
        </div>
      )}
    </div>
  );
};

export const JobInputsOutputs = ({ pipelineRunResult: foo }: JobInputsOutputsProps) => {
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
            <Icon icon='arrowRight' size={24} style={{ color: colors.dark(0.8) }} />
          </div>

          <JobOutputs
            outputDefinitions={outputDefinitions}
            outputs={pipelineRunResult.pipelineRunReport.outputs}
            status={pipelineRunResult.jobReport.status}
          />
        </div>
      )}
    </PipelineWidgetContainer>
  );
};
