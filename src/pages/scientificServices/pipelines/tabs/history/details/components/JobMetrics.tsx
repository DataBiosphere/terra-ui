import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import { TooltipTrigger } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface JobMetricsProps {
  pipelineRunResult: PipelineRunResponse;
}

// Mock file sizes for demonstration
const MOCK_METRICS: Record<string, string> = {
  'Total number of contigs processed': '2',
  'Total number of variants in raw input': '65234',
  'Total number of variants in filtered input': '64295',
  'Percent input variants passing filtering': '98.6%',
  'Total number of filtered variants matching reference panel': '63696',
  'Percent filtered variants matching reference panel': '99.1%',
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
      <TooltipTrigger content='Here is a full description for the input'>
        <span>{label}</span>
      </TooltipTrigger>
    </div>
    <div style={{ color: colors.dark(), wordBreak: 'break-all' }}>{value}</div>
  </div>
);

const OutputItem = ({ label, url, fileSize }: { label: string; url: string; fileSize: string }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{fileSize}</span>
        </div>
      </div>
      <ButtonPrimary
        onClick={() => {
          console.log(url);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem',
          gap: '0.25rem',
          borderRadius: '4px',
          cursor: 'pointer',
          marginLeft: '1rem',
        }}
      >
        <Icon icon='download' size={16} />
      </ButtonPrimary>
    </div>
  );
};

export const JobMetrics = ({ pipelineRunResult }: JobMetricsProps) => {
  const { pipelineDetails, isLoading } = usePipelineDetails(
    pipelineRunResult.pipelineRunReport.pipelineName,
    pipelineRunResult.pipelineRunReport.pipelineVersion
  );

  const hasOutputs =
    pipelineRunResult.pipelineRunReport.outputs && Object.keys(pipelineRunResult.pipelineRunReport.outputs).length > 0;

  return (
    <PipelineWidgetContainer title='Metrics' border='1px solid #d7d9dc' showIcon={false}>
      {isLoading ? (
        <div style={{ color: colors.dark(0.6) }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {/* Metrics Column */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              {Object.entries(MOCK_METRICS).map(([label, value]) => (
                <InfoItem key={label} label={label} value={value} />
              ))}
            </div>
          </div>
        </div>
      )}
    </PipelineWidgetContainer>
  );
};
