import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { cond, DEFAULT } from 'src/libs/utils';
import { OUTPUT_DESCRIPTIONS } from 'src/pages/scientificServices/pipelines/utils/output-utils';

export const PipelineOutputsWidget = ({
  selectedPipelineDetails,
}: {
  selectedPipelineDetails?: PipelineWithDetails;
}) => {
  const pipelineOutputs = selectedPipelineDetails?.outputs;

  return (
    <div
      style={{
        marginTop: '1rem',
        backgroundColor: '#f4f6f9',
        width: 400,
        padding: '1rem',
        borderRadius: '4px',
      }}
    >
      <h3 style={{ marginTop: '0.5rem' }}>
        <Icon icon='info-circle' style={{ color: '#5CC88D' }} /> Pipeline Outputs
      </h3>
      {cond(
        [!selectedPipelineDetails, () => <div style={{ marginTop: '1rem' }}>Select a pipeline to see outputs</div>],
        [
          !!pipelineOutputs,
          () => {
            if (!pipelineOutputs) {
              // this should never happen because of the cond predicate above, but typescript
              // has no idea what cond is doing, so we sadly need the extra type guard
              return <div style={{ marginTop: '1rem' }}>This pipeline does not have any outputs.</div>;
            }
            return (
              <div style={{ marginTop: '1rem' }}>
                {pipelineOutputs.map((output) => (
                  <OutputDetails key={output.name} outputName={output.name} outputType={output.type} />
                ))}
              </div>
            );
          },
        ],
        [DEFAULT, () => <div style={{ marginTop: '1rem' }}>Loading pipeline details...</div>]
      )}
    </div>
  );
};

const OutputDetails = ({ outputName, outputType }: { outputName: string; outputType: 'FILE' | 'STRING' }) => {
  return (
    <div style={{ marginTop: '1rem', borderLeft: '3px solid #e4e5e6', paddingLeft: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 500, paddingBottom: '0.5rem' }}>{outputName}</div>
        <div
          style={{
            backgroundColor: OUTPUT_TYPE_COLORS[outputType],
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            padding: '0.1rem 0.25rem',
          }}
        >
          <Icon
            icon={outputType === 'FILE' ? 'fileAlt' : 'fileAlt'}
            data-testid={`output-type-${outputType.toLowerCase()}`}
          />
          <span
            style={{
              marginLeft: '0.25rem',
              fontSize: '0.875rem',
            }}
          >
            {outputType.toLowerCase()}
          </span>
        </div>
      </div>
      <div style={{ width: '80%' }}>
        {OUTPUT_DESCRIPTIONS[outputName]
          ? OUTPUT_DESCRIPTIONS[outputName].helpText
          : `No description available for this ${outputType.toLowerCase()} output.`}
      </div>
    </div>
  );
};

const OUTPUT_TYPE_COLORS: Record<'FILE' | 'STRING', string> = {
  FILE: '#e7f3fb',
  STRING: '#5cc88d',
};
