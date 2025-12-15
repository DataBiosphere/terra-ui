import { TooltipTrigger } from '@terra-ui-packages/components';
import React from 'react';
import { ReactNode } from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { PipelineIOTypeBadge } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineIOTypeBadge';

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

export const JobInputsView = ({ inputDefinitions, inputs }: JobInputsProps) => {
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
