import { Icon, TooltipTrigger } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { PipelineOutput, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { PipelineErrorMessage } from 'src/pages/scientificServices/pipelines/common/PipelineErrorMessage';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { OutputDetailsModal } from 'src/pages/scientificServices/pipelines/tabs/history/details/modals/OutputDetailsModal';
import { PipelineIOTypeBadge } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineIOTypeBadge';

interface JobOutputsViewProps {
  outputDefinitions: PipelineOutput[];
  pipelineRunResult: PipelineRunResponse;
}

export const JobOutputsView = ({ outputDefinitions, pipelineRunResult }: JobOutputsViewProps) => {
  const [selectedOutput, setSelectedOutput] = useState<{ key: string; fileName: string } | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>();

  const isSucceeded = pipelineRunResult.jobReport.status === 'SUCCEEDED';
  const isFailed = pipelineRunResult.jobReport.status === 'FAILED';
  const outputs = pipelineRunResult.pipelineRunReport.outputs;
  const hasOutputs = outputs && Object.keys(outputs).length > 0;

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
      return (
        <PipelineErrorMessage
          title='There was an error.'
          message={
            <>
              This run does not have any outputs to display. There was either an issue running the pipeline or
              retrieving the outputs. Please reload the page, or contact{' '}
              <a style={{ textDecoration: 'underline' }} href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`}>
                {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
              </a>{' '}
              for further assistance.
            </>
          }
        />
      );
    }
    if (pipelineRunResult.jobReport.status === 'RUNNING') {
      return 'The job is still in progress. Outputs will be available after the job completes.';
    }
  };

  const dataDeliverySucceeded = pipelineRunResult.pipelineRunReport.dataDeliveryReport?.status === 'SUCCEEDED';

  const outputExpirationDate = pipelineRunResult.pipelineRunReport.outputExpirationDate
    ? new Date(pipelineRunResult.pipelineRunReport.outputExpirationDate)
    : null;

  const outputsExpired = outputExpirationDate && new Date() > outputExpirationDate;

  let outputExpirationText: string | null = null;
  if (outputsExpired) {
    outputExpirationText = `Expired on ${outputExpirationDate.toLocaleDateString()}`;
  } else if (outputExpirationDate) {
    outputExpirationText = `Available until ${outputExpirationDate.toLocaleDateString()}`;
  }

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
        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Outputs</h4>
        {dataDeliverySucceeded ? (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon icon='clock' size={16} style={{ color: colors.dark(0.55) }} />
              Data Delivered
            </div>
          </div>
        ) : (
          outputExpirationDate && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon icon='clock' size={16} style={{ color: colors.dark(0.55) }} />
                {outputExpirationText}
              </div>
            </div>
          )
        )}
      </div>
      {hasOutputs ? (
        <div>
          {Object.entries(outputs).map(([key, value]) => {
            const outputDefinition = outputDefinitions.find((output) => output.name === key);

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
                  fileName={value}
                  disabled={!isSucceeded || !!outputsExpired}
                  onSelect={() => setSelectedOutput({ key, fileName: value })}
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

      {selectedOutput && (
        <OutputDetailsModal
          outputKey={selectedOutput.key}
          outputDefinition={outputDefinitions.find((output) => output.name === selectedOutput.key)}
          fileName={selectedOutput.fileName}
          pipelineRunResult={pipelineRunResult}
          onDismiss={() => setSelectedOutput(null)}
          signedUrls={signedUrls}
          setSignedUrls={setSignedUrls}
        />
      )}
    </div>
  );
};

const OutputItem = ({
  label,
  fileName,
  tooltip,
  outputType,
  disabled,
  onSelect,
}: {
  label: string;
  fileName: string;
  tooltip: string;
  outputType: string;
  disabled?: boolean;
  onSelect: () => void;
}) => {
  return (
    <div>
      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TooltipTrigger content={tooltip}>
          <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{label}</span>
        </TooltipTrigger>
        <PipelineIOTypeBadge type={outputType} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '0.25rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <code>{fileName}</code>
        {!disabled && (
          <button
            type='button'
            onClick={onSelect}
            style={{
              color: '#46A3E9',
              fontWeight: 700,
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              alignSelf: 'flex-start',
            }}
          >
            <Icon icon='pop-out' size={14} />
            View details
          </button>
        )}
        {disabled && <span style={{ color: colors.dark(0.5), fontStyle: 'italic' }}>Not available</span>}
      </div>
    </div>
  );
};
