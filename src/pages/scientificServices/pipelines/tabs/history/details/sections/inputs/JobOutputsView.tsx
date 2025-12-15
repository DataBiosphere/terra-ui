import { Icon, TooltipTrigger } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineOutput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { PipelineIOTypeBadge } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineIOTypeBadge';

interface JobOutputsViewProps {
  outputDefinitions: PipelineOutput[];
  outputs: Record<string, string> | undefined;
  status: string;
}

export const JobOutputsView = ({ outputDefinitions, outputs, status }: JobOutputsViewProps) => {
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
  };

  return (
    <div style={{ flex: 1 }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Outputs</h4>
      {hasOutputs ? (
        <div>
          {Object.entries(outputs).map(([key, value]) => {
            const outputDefinition = outputDefinitions.find((input) => input.name === key);

            return (
              <div
                key={key}
                style={{
                  marginTop: '1rem',
                  borderLeft: '3px solid #e4e5e6',
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #d6d9dc',
                  borderRadius: '4px',
                }}
              >
                <OutputItem
                  label={outputDefinition?.displayName || key}
                  outputType={outputDefinition?.type || 'Unknown'}
                  tooltip={outputDefinition?.description || 'No description available for this output'}
                  url={value}
                  fileSize='127 KB'
                  disabled={!isSucceeded}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: colors.dark(0.6), fontSize: '0.875rem', fontStyle: isFailed ? 'italic' : 'normal' }}>
          {getEmptyMessage()}
        </div>
      )}
    </div>
  );
};

const OutputItem = ({
  label,
  url,
  tooltip,
  outputType,
  fileSize,
  disabled,
}: {
  label: string;
  url: string;
  tooltip: string;
  outputType: string;
  fileSize: string;
  disabled?: boolean;
}) => {
  return (
    <div>
      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TooltipTrigger content={tooltip}>
          <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{label}</span>
        </TooltipTrigger>
        <PipelineIOTypeBadge type={outputType} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {!disabled && (
          <button
            type='button'
            onClick={() => {
              // TODO: capture mixpanel download metric
              window.open(url, '_blank');
            }}
            style={{
              color: '#46A3E9',
              fontWeight: 700,
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Icon icon='download' size={14} />
            Download
          </button>
        )}
        <span style={{ color: disabled ? colors.dark(0.5) : colors.dark(), fontStyle: 'italic' }}>
          {disabled ? 'Not available' : fileSize}
        </span>
      </div>
    </div>
  );
};
