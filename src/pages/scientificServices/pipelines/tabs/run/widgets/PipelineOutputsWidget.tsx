import React from 'react';
import { PipelineOutput, PipelineWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { cond, DEFAULT } from 'src/libs/utils';

import { PipelineIOTypeBadge } from './PipelineIOTypeBadge';
import { PipelineWidgetContainer } from './PipelineWidgetContainer';

export const PipelineOutputsWidget = ({
  selectedPipelineDetails,
}: {
  selectedPipelineDetails?: PipelineWithDetails;
}) => {
  const pipelineOutputs = selectedPipelineDetails?.outputs;

  return (
    <PipelineWidgetContainer title='Pipeline Outputs' width={400}>
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
                  <OutputDetails key={output.name} output={output} />
                ))}
              </div>
            );
          },
        ],
        [DEFAULT, () => <div style={{ marginTop: '1rem' }}>Loading pipeline details...</div>]
      )}
    </PipelineWidgetContainer>
  );
};

const OutputDetails = ({ output }: { output: PipelineOutput }) => {
  const { name, type, displayName, description } = output;

  return (
    <div style={{ marginTop: '1rem', borderLeft: '3px solid #e4e5e6', paddingLeft: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 500, paddingBottom: '0.5rem', textTransform: 'capitalize' }}>
          {displayName || name}
        </div>
        <PipelineIOTypeBadge type={type} />
      </div>
      <div style={{ width: '80%', fontSize: 13 }}>{description || 'No description available'}</div>
    </div>
  );
};
