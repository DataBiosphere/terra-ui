import { Icon, TooltipTrigger } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { bucketFileBrowserUrl } from 'src/auth/auth';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { PipelineInput, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { PipelineErrorMessage } from 'src/pages/scientificServices/pipelines/common/PipelineErrorMessage';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { PipelineIOTypeBadge } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineIOTypeBadge';
import { GCS_PATH_VALIDATION_REGEX } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

const parseGcsPath = (path: string): { bucket: string; object: string } | null => {
  const match = path.match(/^gs:\/\/([a-z0-9._-]+)\/(.+)$/);
  return match ? { bucket: match[1], object: match[2] } : null;
};

const GcsValueDisplay = ({ path }: { path: string }) => {
  const parsed = parseGcsPath(path);
  const consoleUrl = parsed ? bucketFileBrowserUrl(parsed.bucket, parsed.object) : null;

  if (!consoleUrl) {
    return <code style={{ wordBreak: 'break-all' }}>{path}</code>;
  }

  return (
    <a
      href={consoleUrl}
      target='_blank'
      rel='noreferrer'
      title={path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        color: '#46A3E9',
        textDecoration: 'none',
        width: '100%',
        minWidth: 0,
      }}
    >
      {/* <CloudProviderIcon cloudProvider='GCP' style={{ width: 14, height: 14, flexShrink: 0 }} /> */}
      <code
        style={{
          flex: 1,
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          direction: 'rtl',
          textAlign: 'left',
          minWidth: 0,
          color: 'inherit',
        }}
      >
        <span style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}>{path}</span>
      </code>
      <Icon icon='pop-out' size={12} style={{ flexShrink: 0 }} />
    </a>
  );
};

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
    <div style={{ color: colors.dark(), display: 'flex', minWidth: 0 }}>{value}</div>
  </div>
);

interface JobInputsProps {
  inputDefinitions: PipelineInput[];
  pipelineRunResult: PipelineRunResponse;
}

export const JobInputsView = ({ inputDefinitions, pipelineRunResult }: JobInputsProps) => {
  const inputs = pipelineRunResult.pipelineRunReport.userInputs || {};
  const hasInputs = inputs && Object.keys(inputs).length > 0;
  const inputSize = pipelineRunResult.pipelineRunReport.inputSize;

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
        {inputSize && (
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
              Input Size: {inputSize} {pipelineRunResult.pipelineRunReport.inputSizeUnits || ''}
            </div>
          </div>
        )}
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
                  value={
                    GCS_PATH_VALIDATION_REGEX.test(value) ? <GcsValueDisplay path={value} /> : <code>{value}</code>
                  }
                  tooltip={inputDef?.description || 'No description available for this input'}
                  inputType={inputDef?.type || 'Unknown'}
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
