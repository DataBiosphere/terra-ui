import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface JobInputsOutputsProps {
  pipelineRunResult: PipelineRunResponse;
}

// Mock file sizes for demonstration
const MOCK_FILE_SIZES: Record<string, string> = {
  'Imputed Multi-Sample VCF': '2.4 GB',
  'Imputed Multi-Sample VCF Index': '1.2 MB',
  'Contigs Metrics TSV': '45 KB',
  'Imputation Chunks QC TSV': '128 KB',
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>{label}</div>
    <div style={{ color: colors.dark(), wordBreak: 'break-all' }}>{value}</div>
  </div>
);

const OutputItem = ({ label, url, fileSize }: { label: string; url: string; fileSize: string }) => {
  const handleDownload = () => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>{label}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{}}>{fileSize}</span>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: colors.accent(0.1),
              border: `1px solid ${colors.accent()}`,
              borderRadius: '4px',
              color: colors.accent(),
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent(0.2);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent(0.1);
            }}
          >
            <Icon icon='download' size={12} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export const JobInputsOutputs = ({ pipelineRunResult }: JobInputsOutputsProps) => {
  const { pipelineDetails, isLoading } = usePipelineDetails(
    pipelineRunResult.pipelineRunReport.pipelineName,
    pipelineRunResult.pipelineRunReport.pipelineVersion
  );

  const hasOutputs =
    pipelineRunResult.pipelineRunReport.outputs && Object.keys(pipelineRunResult.pipelineRunReport.outputs).length > 0;

  return (
    <PipelineWidgetContainer title='Inputs & Outputs'>
      {isLoading ? (
        <div style={{ color: colors.dark(0.6) }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {/* Inputs Column */}
          <div style={{ flex: 1 }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Inputs</h4>
            {pipelineDetails && pipelineDetails.inputs.length > 0 ? (
              <div>
                {/* @ts-ignore */}
                {Object.entries(pipelineRunResult.pipelineRunReport.inputs!).map(([key, value]) => (
                  <InfoItem key={key} label={key} value={<div style={{ fontSize: 13 }}>{value}</div>} />
                ))}
              </div>
            ) : (
              <div style={{ color: colors.dark(0.6), fontSize: '0.875rem' }}>No inputs defined</div>
            )}
          </div>

          {/* Arrow Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon='arrowRight' size={24} style={{ color: colors.dark(0.7) }} />
          </div>

          {/* Outputs Column */}
          <div style={{ flex: 1 }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Outputs</h4>
            {hasOutputs ? (
              <div>
                {Object.entries(pipelineRunResult.pipelineRunReport.outputs!).map(([key, value]) => (
                  <OutputItem key={key} label={key} url={value} fileSize={MOCK_FILE_SIZES[key] || '0 KB'} />
                ))}
              </div>
            ) : pipelineRunResult.jobReport.status === 'SUCCEEDED' ? (
              <div style={{}}>No outputs available</div>
            ) : pipelineRunResult.jobReport.status === 'RUNNING' ||
              pipelineRunResult.jobReport.status === 'PREPARING' ? (
              <div style={{}}>Outputs will be available when job completes</div>
            ) : (
              <div style={{}}>No outputs generated</div>
            )}
          </div>
        </div>
      )}
    </PipelineWidgetContainer>
  );
};
