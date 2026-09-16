import { Icon, Spinner, TooltipTrigger } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { PipelineOutput, PipelineOutputValue, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import { notify } from 'src/libs/notifications';
import { formatBytes } from 'src/libs/utils';
import { PipelineErrorMessage } from 'src/pages/scientificServices/pipelines/common/PipelineErrorMessage';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { useOutputSignedUrls } from 'src/pages/scientificServices/pipelines/hooks/useOutputSignedUrls';
import { PipelineIOTypeBadge } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineIOTypeBadge';
import { downloadSignedUrl } from 'src/pages/scientificServices/pipelines/utils/file-utils';

interface JobOutputsViewProps {
  outputDefinitions: PipelineOutput[];
  pipelineRunResult: PipelineRunResponse;
}

// Identifies the file a download is in flight for; index is only set for files within a FILE_ARRAY output
interface DownloadingFile {
  key: string;
  index?: number;
}

export const JobOutputsView = ({ outputDefinitions, pipelineRunResult }: JobOutputsViewProps) => {
  const [downloadingFile, setDownloadingFile] = useState<DownloadingFile | null>(null);
  const { getSignedUrl } = useOutputSignedUrls(pipelineRunResult.jobReport.id);

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

  const handleDownload = async (key: string, fileName: string, sizeInBytes?: number, index?: number) => {
    try {
      setDownloadingFile({ key, index });

      const signedUrl = await getSignedUrl(key, index);
      if (!signedUrl) {
        notify('error', 'There was an error retrieving the download. Please try again.');
        return;
      }

      downloadSignedUrl(signedUrl, fileName);

      Metrics().captureEvent(Events.teaspoons.downloadJobOutputFile, {
        pipelineName: pipelineRunResult.pipelineRunReport.pipelineName,
        pipelineVersion: pipelineRunResult.pipelineRunReport.pipelineVersion,
        outputName: key,
        fileName,
        fileIndex: index,
        fileSize: sizeInBytes,
      });
    } catch (err) {
      notify('error', 'There was an error retrieving the download. Please try again.');
    } finally {
      setDownloadingFile(null);
    }
  };

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
          {Object.entries(outputs).map(([key, outputValue]) => {
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
                {Array.isArray(outputValue) ? (
                  <OutputArrayItem
                    label={outputDefinition?.displayName || key}
                    outputType={outputDefinition?.type || 'FILE_ARRAY'}
                    tooltip={outputDefinition?.description || 'No description available for this output'}
                    files={outputValue}
                    disabled={!isSucceeded || !!outputsExpired}
                    delivered={dataDeliverySucceeded}
                    downloadingIndex={downloadingFile?.key === key ? downloadingFile.index : undefined}
                    onDownloadFile={(index, file) => handleDownload(key, file.value, file.metadata?.sizeInBytes, index)}
                  />
                ) : (
                  <OutputItem
                    label={outputDefinition?.displayName || key}
                    outputType={outputDefinition?.type || 'Unknown'}
                    tooltip={outputDefinition?.description || 'No description available for this output'}
                    fileName={outputValue.value}
                    sizeInBytes={outputValue.metadata?.sizeInBytes}
                    disabled={!isSucceeded || !!outputsExpired}
                    delivered={dataDeliverySucceeded}
                    downloading={downloadingFile?.key === key}
                    onDownload={() => handleDownload(key, outputValue.value, outputValue.metadata?.sizeInBytes)}
                  />
                )}
              </div>
            );
          })}
          {isSucceeded && !outputsExpired && !dataDeliverySucceeded && <BulkDownloadNotice />}
        </div>
      ) : (
        <div style={{ color: colors.dark(0.6), fontSize: 14, fontStyle: isFailed ? 'italic' : 'normal' }}>
          {getEmptyMessage()}
        </div>
      )}
    </div>
  );
};

const linkButtonStyle: React.CSSProperties = {
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
};

const DownloadFileButton = ({ downloading, onDownload }: { downloading?: boolean; onDownload: () => void }) => (
  <div style={{ minWidth: '120px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
    <button
      type='button'
      onClick={onDownload}
      disabled={downloading}
      style={{ ...linkButtonStyle, cursor: downloading ? 'default' : 'pointer' }}
    >
      {downloading ? <Spinner size={14} /> : <Icon icon='download' size={14} />}
      Download
    </button>
  </div>
);

const OutputItem = ({
  label,
  fileName,
  tooltip,
  outputType,
  sizeInBytes,
  disabled,
  delivered,
  downloading,
  onDownload,
}: {
  label: string;
  fileName: string;
  tooltip: string;
  outputType: string;
  sizeInBytes?: number;
  disabled?: boolean;
  delivered?: boolean;
  downloading?: boolean;
  onDownload: () => void;
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
          wordBreak: 'break-all',
        }}
      >
        <code style={{ maxWidth: '70%' }} title={fileName}>
          {fileName}{' '}
          {sizeInBytes !== undefined && (
            <span style={{ fontStyle: 'italic', fontWeight: 'lighter' }}>({formatBytes(sizeInBytes)})</span>
          )}
        </code>
        {/* once outputs have been delivered to a cloud destination, the Data Delivery section is
            where users go for them, so there's no per-file download here */}
        {!disabled && !delivered && <DownloadFileButton downloading={downloading} onDownload={onDownload} />}
        {disabled && <span style={{ color: colors.dark(0.5), fontStyle: 'italic' }}>Not available</span>}
      </div>
    </div>
  );
};

const COLLAPSED_FILE_COUNT = 3;

const OutputArrayItem = ({
  label,
  tooltip,
  outputType,
  files,
  disabled,
  delivered,
  downloadingIndex,
  onDownloadFile,
}: {
  label: string;
  tooltip: string;
  outputType: string;
  files: PipelineOutputValue[];
  disabled?: boolean;
  delivered?: boolean;
  downloadingIndex?: number;
  onDownloadFile: (index: number, file: PipelineOutputValue) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const visibleFiles = expanded ? files : files.slice(0, COLLAPSED_FILE_COUNT);

  return (
    <div>
      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TooltipTrigger content={tooltip}>
          <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{label}</span>
        </TooltipTrigger>
        <PipelineIOTypeBadge type={outputType} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {visibleFiles.map((file, index) => (
          <div
            key={file.value}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '0.25rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              wordBreak: 'break-all',
            }}
          >
            <code style={{ maxWidth: '70%' }} title={file.value}>
              {file.value}{' '}
              {file.metadata?.sizeInBytes !== undefined && (
                <span style={{ fontStyle: 'italic', fontWeight: 'lighter' }}>
                  ({formatBytes(file.metadata.sizeInBytes)})
                </span>
              )}
            </code>
            {!disabled && !delivered && (
              <DownloadFileButton
                downloading={downloadingIndex === index}
                onDownload={() => onDownloadFile(index, file)}
              />
            )}
            {disabled && <span style={{ color: colors.dark(0.5), fontStyle: 'italic' }}>Not available</span>}
          </div>
        ))}
      </div>
      {files.length > COLLAPSED_FILE_COUNT && (
        <button
          type='button'
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          style={{ ...linkButtonStyle, marginTop: '0.5rem' }}
        >
          <Icon icon={expanded ? 'angle-up' : 'angle-down'} size={14} />
          {expanded ? 'Show fewer files' : `Show all ${files.length} files`}
        </button>
      )}
    </div>
  );
};

const BulkDownloadNotice = () => (
  <div
    style={{
      marginTop: '1rem',
      display: 'flex',
      alignItems: 'stretch',
      backgroundColor: 'white',
      border: '1px solid #d6d9dc',
      borderRadius: '4px',
      fontSize: 14,
      color: colors.dark(0.75),
    }}
  >
    <div
      style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.75rem' }}
    >
      <Icon icon='info-circle' size={28} style={{ color: colors.primary() }} />
    </div>
    <div style={{ padding: '0.5rem 0.75rem 0.5rem 0' }}>
      Download all files at once using the <ZendeskLink docsKey={DocsKey.CLI_DOWNLOADS}>CLI</ZendeskLink> or using{' '}
      <ZendeskLink docsKey={DocsKey.CLOUD_OUTPUTS}>Cloud Delivery</ZendeskLink>. Support for zip downloads of all files
      in the UI is coming soon.
    </div>
  </div>
);
