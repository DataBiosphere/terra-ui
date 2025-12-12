import { Icon } from '@terra-ui-packages/components';
import { TooltipTrigger } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { PipelineInput, PipelineOutput, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { JobOutputsView } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/inputs/JobOutputsView';
import { PipelineIOTypeBadge } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineIOTypeBadge';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface PipelineRunIOViewProps {
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
      <PipelineIOTypeBadge type={inputType} />
    </div>
    <div style={{ color: colors.dark(), wordBreak: 'break-all' }}>{value}</div>
  </div>
);

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
                  border: '1px solid #d6d9dc',
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

export const PipelineRunIOView = ({ pipelineRunResult: foo }: PipelineRunIOViewProps) => {
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
    <PipelineWidgetContainer title='Inputs & Outputs' border='1px solid #d6d9dc' showIcon={false}>
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

          <div style={{ flex: 1 }}>
            <JobOutputsView
              outputDefinitions={outputDefinitions}
              outputs={pipelineRunResult.pipelineRunReport.outputs}
              status={pipelineRunResult.jobReport.status}
            />
            {pipelineRunResult.errorReport && (
              <div style={{ marginTop: '1rem', color: colors.danger(), fontStyle: 'italic' }}>
                {pipelineRunResult.errorReport.message}
              </div>
            )}
          </div>
        </div>
      )}
    </PipelineWidgetContainer>
  );
};
