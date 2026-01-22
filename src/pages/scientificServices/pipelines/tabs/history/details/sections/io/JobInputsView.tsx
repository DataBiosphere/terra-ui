import { Icon, TooltipTrigger } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { PipelineErrorMessage } from 'src/pages/scientificServices/pipelines/common/PipelineErrorMessage';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Inputs</h4>
          <TooltipTrigger content='Inputs include both values you provided and defaults for any parameters you did not specify.'>
            <Icon icon='help' size={16} style={{ color: colors.dark(0.55) }} />
          </TooltipTrigger>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'white',
            padding: '0.5rem 0.75rem',
            border: '1px solid #D8D9DC',
            borderRadius: '20px',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Icon icon='tachometer' size={16} style={{ color: colors.dark(0.55) }} />
            Input Size: 50 samples
          </div>
        </div>
      </div>
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
                  value={<code>{value}</code>}
                  tooltip={inputDef?.description || 'No description available for this input'}
                  inputType={inputDef?.type || 'STRING'}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <PipelineErrorMessage
          title='There was an error.'
          message={
            <>
              This run does not have any inputs to display. There was either an issue running the pipeline or retrieving
              the inputs. Please reload the page, or contact{' '}
              <a style={{ textDecoration: 'underline' }} href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`}>
                {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
              </a>{' '}
              for further assistance.
            </>
          }
        />
      )}
    </div>
  );
};
