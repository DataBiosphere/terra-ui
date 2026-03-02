import { Icon } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useState } from 'react';
import { PipelineOutput, PipelineWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { cond, DEFAULT } from 'src/libs/utils';

import { PipelineIOTypeBadge } from './PipelineIOTypeBadge';
import { PipelineWidgetContainer } from './PipelineWidgetContainer';

const TYPE_LABELS: Record<string, string> = {
  FILE: 'file',
  STRING: 'string',
  FLOAT: 'float',
  BOOLEAN: 'boolean',
};

const buildSummary = (outputs: PipelineOutput[]): string => {
  const counts = _.countBy((o) => o.type.toUpperCase(), outputs);
  const parts = Object.entries(counts).map(([type, count]) => {
    const label = TYPE_LABELS[type] ?? type.toLowerCase();
    return `${count} ${label}${count === 1 ? '' : ''} output${count === 1 ? '' : 's'}`;
  });
  // e.g. "6 file outputs, 2 string outputs, and 1 float output"
  if (parts.length === 0) return '';
  if (parts.length === 1) return `This pipeline produces ${parts[0]}.`;
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1);
  return `This pipeline produces ${rest.join(', ')}, and ${last}.`;
};

export const PipelineOutputsWidget = ({
  selectedPipelineDetails,
}: {
  selectedPipelineDetails?: PipelineWithDetails;
}) => {
  const pipelineOutputs = selectedPipelineDetails?.outputs;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <PipelineWidgetContainer title='Pipeline Outputs'>
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
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ color: '#555', marginBottom: '0.5rem' }}>{buildSummary(pipelineOutputs)}</div>
                <button
                  type='button'
                  onClick={() => setIsExpanded((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#46A3E9',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Icon icon={isExpanded ? 'angle-down' : 'angle-right'} size={14} style={{ flexShrink: 0 }} />
                  {isExpanded ? 'Hide outputs' : 'Show outputs'}
                </button>
                {isExpanded && (
                  <div>
                    {pipelineOutputs.map((output) => (
                      <OutputDetails key={output.name} output={output} />
                    ))}
                  </div>
                )}
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
