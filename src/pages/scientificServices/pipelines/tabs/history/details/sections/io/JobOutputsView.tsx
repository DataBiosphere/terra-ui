import { Icon, TooltipTrigger } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { PipelineOutput, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import { useCancellation } from 'src/libs/react-utils';
import { PipelineIOTypeBadge } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineIOTypeBadge';
import { getOutputFileSize } from 'src/pages/scientificServices/pipelines/utils/download-utils';

interface JobOutputsViewProps {
  outputDefinitions: PipelineOutput[];
  pipelineRunResult: PipelineRunResponse;
}

export const JobOutputsView = ({ outputDefinitions, pipelineRunResult }: JobOutputsViewProps) => {
  const [loading, setLoading] = useState(true);
  const [fileSizes, setFileSizes] = useState<Record<string, string | null>>({});
  const signal = useCancellation();

  const isSucceeded = pipelineRunResult.jobReport.status === 'SUCCEEDED';
  const isFailed = pipelineRunResult.jobReport.status === 'FAILED';
  const outputs = pipelineRunResult.pipelineRunReport.outputs;
  const hasOutputs = outputs && Object.keys(outputs).length > 0;

  useEffect(() => {
    const fetchOutputFileSizes = async () => {
      try {
        setLoading(true);
        if (pipelineRunResult.pipelineRunReport.outputs) {
          const outputs = Object.entries(pipelineRunResult.pipelineRunReport.outputs);
          const initialState = outputs.reduce((acc, [key]) => ({ ...acc, [key]: null }), {});
          setFileSizes(initialState);

          for (const [key, url] of outputs) {
            try {
              const size = await getOutputFileSize(url);
              setFileSizes((prev) => ({ ...prev, [key]: size }));
            } catch {
              setFileSizes((prev) => ({ ...prev, [key]: 'Unknown size' }));
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOutputFileSizes();
  }, [pipelineRunResult.pipelineRunReport.outputs, signal]);

  const getEmptyMessage = () => {
    const now = new Date();
    if (
      isSucceeded &&
      pipelineRunResult.pipelineRunReport.outputExpirationDate &&
      now > new Date(pipelineRunResult.pipelineRunReport.outputExpirationDate)
    ) {
      return `The outputs for this job expired on ${new Date(
        pipelineRunResult.pipelineRunReport.outputExpirationDate
      ).toLocaleDateString()} and are no longer available.`;
    }
    if (isSucceeded) {
      return 'This job succeeded, but did not produce any outputs.';
    }
    if (pipelineRunResult.jobReport.status === 'RUNNING') {
      return 'The job is still in progress. Outputs will be available after the job completes.';
    }
  };

  return (
    <div style={{ flex: 1 }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: 16, fontWeight: 600 }}>Outputs</h4>
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
                  fileSize={loading ? 'Loading file size...' : fileSizes[key] || undefined}
                  disabled={!isSucceeded}
                  pipelineRunResult={pipelineRunResult}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: colors.dark(0.6), fontSize: 14, fontStyle: isFailed ? 'italic' : 'normal' }}>
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
  pipelineRunResult,
}: {
  label: string;
  url: string;
  tooltip: string;
  outputType: string;
  fileSize?: string;
  disabled?: boolean;
  pipelineRunResult: PipelineRunResponse;
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
              window.open(url, '_blank');
              Metrics().captureEvent(Events.teaspoons.downloadJobOutputFile, {
                pipelineName: pipelineRunResult.pipelineRunReport.pipelineName,
                pipelineVersion: pipelineRunResult.pipelineRunReport.pipelineVersion,
                outputName: label,
                fileSize,
              });
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
        {fileSize && (
          <span style={{ color: disabled ? colors.dark(0.5) : colors.dark(), fontStyle: 'italic' }}>
            {disabled ? 'Not available' : fileSize}
          </span>
        )}
      </div>
    </div>
  );
};
