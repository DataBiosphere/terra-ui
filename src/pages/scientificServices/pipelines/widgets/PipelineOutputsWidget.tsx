import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineOutput, PipelineWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { cond, DEFAULT } from 'src/libs/utils';
import { PIPELINE_OUTPUT_DESCRIPTIONS } from 'src/pages/scientificServices/pipelines/utils/output-utils';

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
        marginBottom: '1rem',
        backgroundColor: '#f4f6f9',
        width: 400,
        padding: '1rem 1rem 1.5rem 1rem',
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
            if (!pipelineOutputs || pipelineOutputs.length === 0) {
              return (
                <div style={{ marginTop: '1rem', fontStyle: 'italic' }}>This pipeline does not have any outputs</div>
              );
            }
            return (
              <div style={{ marginTop: '1rem' }}>
                {pipelineOutputs.map((output) => (
                  <OutputDetails
                    key={output.name}
                    pipelineName={selectedPipelineDetails.pipelineName}
                    output={output}
                  />
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

const OutputDetails = ({ pipelineName, output }: { pipelineName: string; output: PipelineOutput }) => {
  const outputDescription = PIPELINE_OUTPUT_DESCRIPTIONS[pipelineName]?.[output.name]?.helpText;

  return (
    <div style={{ marginTop: '1rem', borderLeft: '3px solid #e4e5e6', paddingLeft: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 500, paddingBottom: '0.5rem' }}>{output.name}</div>
        <div
          style={{
            backgroundColor: '#e7f3fb',
            borderRadius: 8,
            border: '1px solid #e4e5e6',
            display: 'flex',
            alignItems: 'center',
            padding: '0.25rem 0.5rem',
          }}
        >
          <span
            style={{
              textTransform: 'capitalize',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            {output.type.toLowerCase()}
          </span>
        </div>
      </div>
      <div style={{ width: '80%', fontSize: 13 }}>{outputDescription || 'No description available'}</div>
    </div>
  );
};
